/**
 * دامنه و مدل‌های داده‌ای سیستم Food Factory
 * بر اساس ۲۱ موجودیت پایه و تصمیمات معماری Δ-01 تا Δ-37
 */

export type Role =
  | 'CASHIER'        // صندوق‌دار
  | 'KITCHEN'        // آشپز / سرآشپز
  | 'WAREHOUSE'      // انباردار
  | 'SHIFT_SUPER'    // سرپرست شیفت
  | 'ACCOUNTANT'     // حسابدار
  | 'DELIVERY'       // پیک
  | 'MANAGER';       // مدیر رستوران

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  avatarColor: string;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED';

export interface RestaurantTable {
  id: number;
  number: number;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  lastVisit?: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  unit: 'گرم' | 'عدد' | 'میلی‌لیتر' | 'کیلوگرم';
  stock: number;         // موجودی فعلی
  minThreshold: number;  // حداقل نقطه سفارش
  costPerUnit: number;   // بهای تمام شده (ریال)
  location: 'MAIN_WAREHOUSE' | 'KITCHEN_STOCK' | 'PREP'; // Δ-25 تفکیک انبار و آشپزخانه
}

export interface RecipeIngredient {
  materialId: string;
  amount: number;        // مقدار مصرف به واحد پایه ماده اولیه
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  price: number;         // ریال - عدد صحیح بدون اعشار
  description: string;
  imageEmoji: string;
  badge?: string;
  recipe: RecipeIngredient[];
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;     // Snapshot قیمت در لحظه افزودن به سبد
  note?: string;         // FR-ORD-04 یادداشت آیتم (مثلا بدون پیاز، سس اضافه)
}

export type OrderStatus =
  | 'PENDING_CONFIRMATION' // در انتظار تایید و کسر مواد
  | 'CONFIRMED'            // تایید شده و مواد کسر شده (Δ-01)
  | 'PREPARING'            // در حال پخت در آشپزخانه
  | 'READY'                // آماده تحویل
  | 'COMPLETED'            // تحویل شده و تسویه
  | 'CANCELLED';           // لغو شده

export type PaymentMethod = 'CASH' | 'POS' | 'SPLIT';

export type PaymentStatus =
  | 'PENDING'   // در انتظار
  | 'CONFIRMED' // تایید شده
  | 'FAILED'    // ناموفق
  | 'UNKNOWN';  // نامشخص (FR-PAY-04 برای مغایرت‌گیری و پیگیری وضعیت کارتخوان)

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amount: number;       // ریال
  cashAmount?: number;
  posAmount?: number;
  status: PaymentStatus;
  referenceCode?: string;
  traceNumber?: string;
  timestamp: string;
  posTerminalId?: string;
}

export interface Order {
  id: string;
  dailySequence: number; // شماره متوالی روزانه درشت و بدون تصادفی بودن (رفع باگ #۲)
  eventId: string;       // شناسه یکتای تکرارناپذیر (Idempotent UUID)
  orderType: OrderType;
  tableNumber?: number;
  customer?: Customer;
  isGuest: boolean;      // سفارش مهمان بدون نیاز به ثبت نام و شماره (رفع باگ #۵)
  items: CartItem[];
  totalAmount: number;   // جمع کل به ریال
  status: OrderStatus;
  payment?: PaymentRecord;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cashierName: string;
  kitchenNote?: string;
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  materialId: string;
  materialName: string;
  changeAmount: number;   // منفی برای کسر، مثبت برای ورود
  balanceAfter: number;
  reason: 'ORDER_CONSUMPTION' | 'PURCHASE' | 'WASTE' | 'ADJUSTMENT';
  referenceId?: string;   // شماره سفارش یا فاکتور
  operatorName: string;
}

export interface ShiftInfo {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  initialCash: number;    // موجودی اولیه کشو به ریال
  currentCash: number;    // موجودی فعلی نقدی
  status: 'OPEN' | 'CLOSED';
}
