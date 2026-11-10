import {
  CartItem,
  Customer,
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  RawMaterial,
  RestaurantTable,
  Role,
  ShiftInfo,
  StockLedgerEntry,
  UserProfile,
} from '../domain/types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_MATERIALS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
} from '../domain/seed';
import { deductMaterialsAtomically } from '../domain/inventory';
import { calculateCartTotal } from '../domain/pricing';
import { hasPermission } from '../domain/permissions';

const STORAGE_KEYS = {
  MATERIALS: 'ff_materials_v1',
  TABLES: 'ff_tables_v1',
  ORDERS: 'ff_orders_v1',
  LEDGER: 'ff_ledger_v1',
  SHIFT: 'ff_shift_v1',
  DAILY_SEQ: 'ff_daily_seq_v1',
};

export class PosClientService {
  private materials: RawMaterial[];
  private tables: RestaurantTable[];
  private orders: Order[];
  private ledger: StockLedgerEntry[];
  private currentShift: ShiftInfo;
  private dailySeq: number;

  constructor() {
    this.materials = this.loadOrInit(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    this.tables = this.loadOrInit(STORAGE_KEYS.TABLES, INITIAL_TABLES);
    this.orders = this.loadOrInit(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    this.ledger = this.loadOrInit(STORAGE_KEYS.LEDGER, []);
    this.dailySeq = this.loadOrInit(STORAGE_KEYS.DAILY_SEQ, 1042);
    this.currentShift = this.loadOrInit(STORAGE_KEYS.SHIFT, {
      id: 'SHIFT-2026-11-10',
      cashierId: 'USR-1',
      cashierName: 'سروش قاسمی',
      startTime: new Date().toISOString(),
      initialCash: 15000000, // ۱۵ میلیون ریال موجودی تنخواه
      currentCash: 15000000,
      status: 'OPEN',
    });
  }

  private loadOrInit<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {
      // استفاده از داده‌های پیش‌فرض در صورت عدم دسترسی
    }
    return fallback;
  }

  private save<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // مدیریت حافظه لوکال
    }
  }

  // دریافت اطلاعات پایه
  getMaterials(): RawMaterial[] {
    return [...this.materials];
  }

  getTables(): RestaurantTable[] {
    return [...this.tables];
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  getLedger(): StockLedgerEntry[] {
    return [...this.ledger];
  }

  getShift(): ShiftInfo {
    return { ...this.currentShift };
  }

  getNextDailySequence(): number {
    return this.dailySeq;
  }

  /**
   * بازنشانی کلی داده‌ها به حالت اولیه جهت تست
   */
  resetToDefaults() {
    this.materials = [...INITIAL_MATERIALS];
    this.tables = [...INITIAL_TABLES];
    this.orders = [];
    this.ledger = [];
    this.dailySeq = 1042;
    this.save(STORAGE_KEYS.MATERIALS, this.materials);
    this.save(STORAGE_KEYS.TABLES, this.tables);
    this.save(STORAGE_KEYS.ORDERS, this.orders);
    this.save(STORAGE_KEYS.LEDGER, this.ledger);
    this.save(STORAGE_KEYS.DAILY_SEQ, this.dailySeq);
  }

  /**
   * تایید سفارش و کسر اتمی مواد اولیه (قانون Δ-01 و BR-INV-02)
   * بررسی مجوز در سطح سرویس (مجوز تایید انفجار رسپی)
   */
  confirmOrder(params: {
    cart: CartItem[];
    orderType: OrderType;
    tableNumber?: number;
    customer?: Customer;
    isGuest: boolean;
    user: UserProfile;
    kitchenNote?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const { cart, orderType, tableNumber, customer, isGuest, user, kitchenNote } = params;

    // بررسی مجوز کاربر در سرور / هسته
    if (!hasPermission(user.role, 'CONFIRM_RECIPE_DEDUCTION')) {
      return {
        success: false,
        error: `کاربر با نقش «${user.role}» مجوز تایید سفارش و کسر موجودی انبار را ندارد.`,
      };
    }

    if (!cart || cart.length === 0) {
      return { success: false, error: 'سبد خرید خالی است.' };
    }

    if (orderType === 'DINE_IN' && !tableNumber) {
      return { success: false, error: 'برای سفارش سالن، انتخاب شماره میز الزامی است.' };
    }

    // بررسی اشغال نبودن میز (رفع باگ شماره ۴ پروتوتایپ)
    if (orderType === 'DINE_IN' && tableNumber) {
      const table = this.tables.find((t) => t.number === tableNumber);
      if (table && table.status === 'OCCUPIED') {
        return { success: false, error: `میز شماره ${tableNumber} در حال حاضر اشغال است.` };
      }
    }

    const assignedSeq = this.dailySeq;
    this.dailySeq += 1;
    this.save(STORAGE_KEYS.DAILY_SEQ, this.dailySeq);

    // ۱. کسر اتمی مواد اولیه و ثبت در کاردکس
    const { updatedMaterials, ledgerEntries } = deductMaterialsAtomically(
      cart,
      this.materials,
      assignedSeq,
      user.name
    );

    this.materials = updatedMaterials;
    this.ledger = [...ledgerEntries, ...this.ledger];
    this.save(STORAGE_KEYS.MATERIALS, this.materials);
    this.save(STORAGE_KEYS.LEDGER, this.ledger);

    // ۲. به‌روزرسانی وضعیت میز در صورت سالن بودن
    if (orderType === 'DINE_IN' && tableNumber) {
      this.tables = this.tables.map((t) =>
        t.number === tableNumber
          ? { ...t, status: 'OCCUPIED' as const, currentOrderId: `ORD-${assignedSeq}` }
          : t
      );
      this.save(STORAGE_KEYS.TABLES, this.tables);
    }

    // ۳. ایجاد رکورد سفارش با event_id یکتا
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newOrder: Order = {
      id: `ORD-${assignedSeq}`,
      dailySequence: assignedSeq,
      eventId,
      orderType,
      tableNumber,
      customer,
      isGuest,
      items: cart,
      totalAmount: calculateCartTotal(cart),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      cashierName: user.name,
      kitchenNote,
    };

    this.orders = [newOrder, ...this.orders];
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    return { success: true, order: newOrder };
  }

  /**
   * پردازش پرداخت ۴ وضعیتی (Pending / Confirmed / Failed / Unknown)
   * مطابق با FR-PAY-04 و E-05
   */
  processPayment(params: {
    orderId: string;
    method: PaymentMethod;
    totalAmount: number;
    cashAmount?: number;
    posAmount?: number;
    status: PaymentStatus;
    referenceCode?: string;
    traceNumber?: string;
    posTerminalId?: string;
    user: UserProfile;
  }): { success: boolean; order?: Order; error?: string } {
    const {
      orderId,
      method,
      totalAmount,
      cashAmount,
      posAmount,
      status,
      referenceCode,
      traceNumber,
      posTerminalId,
      user,
    } = params;

    if (!hasPermission(user.role, 'PROCESS_PAYMENT')) {
      return { success: false, error: 'کاربر مجوز پردازش پرداخت را ندارد.' };
    }

    const orderIndex = this.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, error: 'سفارش مورد نظر یافت نشد.' };
    }

    const targetOrder = this.orders[orderIndex];

    const paymentRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      method,
      amount: totalAmount,
      cashAmount,
      posAmount,
      status,
      referenceCode: referenceCode || (status === 'CONFIRMED' ? `REF-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
      traceNumber: traceNumber || (status === 'CONFIRMED' ? `TRC-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
      timestamp: new Date().toISOString(),
      posTerminalId: posTerminalId || 'POS-SADERAT-01',
    };

    // اگر پرداخت نقدی بود، صندوق شیفت را به‌روز کن
    if (status === 'CONFIRMED' && cashAmount && cashAmount > 0) {
      this.currentShift.currentCash += cashAmount;
      this.save(STORAGE_KEYS.SHIFT, this.currentShift);
    }

    const updatedOrder: Order = {
      ...targetOrder,
      payment: paymentRecord,
      completedAt: status === 'CONFIRMED' ? new Date().toISOString() : targetOrder.completedAt,
    };

    this.orders[orderIndex] = updatedOrder;
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    return { success: true, order: updatedOrder };
  }

  /**
   * به‌روزرسانی چرخه حیات سفارش در آشپزخانه (FR-ORD-16/17/18)
   */
  updateOrderStatus(orderId: string, newStatus: OrderStatus, user: UserProfile): { success: boolean; error?: string } {
    if (!hasPermission(user.role, 'UPDATE_PREPARATION') && !hasPermission(user.role, 'CREATE_ORDER')) {
      return { success: false, error: 'کاربر مجوز تغییر وضعیت پخت را ندارد.' };
    }

    const orderIndex = this.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return { success: false, error: 'سفارش یافت نشد.' };

    const order = this.orders[orderIndex];

    // اگر سفارش تحویل داده شد و میز داشت، میز آزاد شود
    if (newStatus === 'COMPLETED' && order.tableNumber) {
      this.tables = this.tables.map((t) =>
        t.number === order.tableNumber
          ? { ...t, status: 'FREE' as const, currentOrderId: undefined }
          : t
      );
      this.save(STORAGE_KEYS.TABLES, this.tables);
    }

    this.orders[orderIndex] = {
      ...order,
      status: newStatus,
    };
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    return { success: true };
  }
}

// ساخت نمونه تکی (Singleton)
export const posClient = new PosClientService();
