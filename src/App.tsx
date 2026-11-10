/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CartItem,
  Customer,
  MenuItem,
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  RawMaterial,
  RestaurantTable,
  ShiftInfo,
  StockLedgerEntry,
  UserProfile,
} from './domain/types';
import { SAMPLE_USERS } from './domain/permissions';
import { posClient } from './services/posClient';
import { Navbar } from './components/Navbar';
import { CustomerTableStep } from './components/CustomerTableStep';
import { MenuCartStep } from './components/MenuCartStep';
import { DeductionStep } from './components/DeductionStep';
import { PaymentStep } from './components/PaymentStep';
import { ReceiptStep } from './components/ReceiptStep';
import { KitchenView } from './components/KitchenView';
import { InventoryView } from './components/InventoryView';
import { DailySalesReport } from './components/DailySalesReport';

type WorkflowStep = 'CUSTOMER_TABLE' | 'MENU_CART' | 'DEDUCTION' | 'PAYMENT' | 'RECEIPT';

export default function App() {
  // هویت کاربر فعال و نقش عملیاتی (جهت ارزیابی ماتریس مجوزها)
  const [currentUser, setCurrentUser] = useState<UserProfile>(SAMPLE_USERS[0]); // صندوق‌دار پیش‌فرض

  // نمای فعال سیستم (صندوق، آشپزخانه، انبار یا گزارش فروش)
  const [activeView, setActiveView] = useState<'POS' | 'KITCHEN' | 'INVENTORY' | 'REPORTS'>('POS');

  // مرحله جاری در فرآیند ۵ مرحله‌ای فروش
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('CUSTOMER_TABLE');

  // متغیرهای فرم سفارش
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | undefined>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [isGuest, setIsGuest] = useState<boolean>(true); // حالت سفارش مهمان سریع به صورت پیش‌فرض فعال
  const [cart, setCart] = useState<CartItem[]>([]);
  const [kitchenNote, setKitchenNote] = useState<string>('');

  // سفارش تایید شده جاری
  const [confirmedOrder, setConfirmedOrder] = useState<Order | undefined>(undefined);

  // پیام خطای سیستمی
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // داده‌های زنده همگام با سرویس POS
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [shift, setShift] = useState<ShiftInfo>(posClient.getShift());

  const refreshState = () => {
    setMaterials(posClient.getMaterials());
    setTables(posClient.getTables());
    setOrders(posClient.getOrders());
    setLedger(posClient.getLedger());
    setShift(posClient.getShift());
  };

  useEffect(() => {
    refreshState();
  }, []);

  // مدیریت افزودن و ویرایش سبد خرید
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: `CART-${Date.now()}-${item.id}`,
          menuItem: item,
          quantity: 1,
          unitPrice: item.price,
        },
      ];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.menuItem.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null);
    });
  };

  const handleUpdateItemNote = (itemId: string, note: string) => {
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, note } : i))
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // تأیید سفارش و کسر اتمی مواد اولیه (قانون Δ-01)
  const handleConfirmOrderDeduction = () => {
    setIsSubmitting(true);
    setErrorMessage('');

    const result = posClient.confirmOrder({
      cart,
      orderType,
      tableNumber: orderType === 'DINE_IN' ? selectedTableNumber : undefined,
      customer: selectedCustomer,
      isGuest,
      user: currentUser,
      kitchenNote,
    });

    setIsSubmitting(false);

    if (!result.success || !result.order) {
      setErrorMessage(result.error || 'خطا در ثبت سفارش');
      return;
    }

    setConfirmedOrder(result.order);
    refreshState();
    setCurrentStep('PAYMENT');
  };

  // پردازش پرداخت چهار وضعیتی (FR-PAY-04)
  const handleProcessPayment = (params: {
    method: PaymentMethod;
    totalAmount: number;
    cashAmount?: number;
    posAmount?: number;
    status: PaymentStatus;
    referenceCode?: string;
    traceNumber?: string;
  }) => {
    if (!confirmedOrder) return;
    setIsSubmitting(true);

    const result = posClient.processPayment({
      orderId: confirmedOrder.id,
      method: params.method,
      totalAmount: params.totalAmount,
      cashAmount: params.cashAmount,
      posAmount: params.posAmount,
      status: params.status,
      referenceCode: params.referenceCode,
      traceNumber: params.traceNumber,
      user: currentUser,
    });

    setIsSubmitting(false);

    if (!result.success || !result.order) {
      setErrorMessage(result.error || 'خطا در ثبت پرداخت');
      return;
    }

    setConfirmedOrder(result.order);
    refreshState();
    setCurrentStep('RECEIPT');
  };

  // بازنشانی کامل وضعیت برای سفارش جدید (رفع کامل باگ شماره ۷ پروتوتایپ)
  const handleResetForNewOrder = () => {
    setCart([]);
    setSelectedCustomer(undefined);
    setIsGuest(true);
    setKitchenNote('');
    setConfirmedOrder(undefined);
    setErrorMessage('');
    setCurrentStep('CUSTOMER_TABLE');
    refreshState();
  };

  // به‌روزرسانی وضعیت سفارش در آشپزخانه
  const handleUpdateKitchenStatus = (orderId: string, status: OrderStatus) => {
    const res = posClient.updateOrderStatus(orderId, status, currentUser);
    if (!res.success) {
      setErrorMessage(res.error || 'خطا در تغییر وضعیت');
    } else {
      refreshState();
    }
  };

  // شارژ تستی انبار
  const handleRestockTest = () => {
    posClient.resetToDefaults();
    refreshState();
    setErrorMessage('');
  };

  const stepsList: { key: WorkflowStep; label: string }[] = [
    { key: 'CUSTOMER_TABLE', label: '۱. مشتری و میز' },
    { key: 'MENU_CART', label: '۲. منو و سبد' },
    { key: 'DEDUCTION', label: '۳. کسر مواد (Δ-01)' },
    { key: 'PAYMENT', label: '۴. پرداخت (FR-PAY-04)' },
    { key: 'RECEIPT', label: '۵. فیش دوگانه' },
  ];

  return (
    <div className="min-h-screen bg-[#eef0f4] text-[#16202e] flex flex-col font-sans" dir="rtl">
      {/* نوار بالایی استاندارد با نمایش نقش و تغییر سریع */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        activeView={activeView}
        onNavigate={setActiveView}
        shiftCash={shift.currentCash}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
      />

      {/* بنر نمایش خطا در صورت بروز نقض قوانین یا دسترسی */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-xs font-bold text-[#dc2626] flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-700 hover:text-black font-black text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* محتوای اصلی بر اساس نمای انتخابی */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeView === 'POS' && (
          <div className="space-y-6">
            {/* نوار پیشرفت ۵ مرحله‌ای سفارش (قابل کلیک برای ناوبری سریع به مراحل قبلی) */}
            <div className="bg-white rounded-2xl border border-[#e3e7ef] p-3 shadow-2xs">
              <div className="grid grid-cols-5 gap-1 sm:gap-2">
                {stepsList.map((stepItem, index) => {
                  const isActive = currentStep === stepItem.key;
                  const stepIndex = stepsList.findIndex((s) => s.key === currentStep);
                  const isPassed = index < stepIndex;

                  return (
                    <button
                      key={stepItem.key}
                      type="button"
                      disabled={!isPassed && !isActive}
                      onClick={() => {
                        if (isPassed) setCurrentStep(stepItem.key);
                      }}
                      className={`py-2 px-1 sm:px-3 rounded-xl text-center text-xs font-bold transition-all truncate ${
                        isActive
                          ? 'bg-[#e8590c] text-white shadow-xs'
                          : isPassed
                          ? 'bg-[#fff1e6] text-[#e8590c] hover:bg-orange-100 cursor-pointer'
                          : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {stepItem.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* صفحات مراحل پنجگانه */}
            {currentStep === 'CUSTOMER_TABLE' && (
              <CustomerTableStep
                orderType={orderType}
                onChangeOrderType={setOrderType}
                selectedTableNumber={selectedTableNumber}
                onSelectTable={setSelectedTableNumber}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
                isGuest={isGuest}
                onToggleGuest={setIsGuest}
                tables={tables}
                onNext={() => setCurrentStep('MENU_CART')}
              />
            )}

            {currentStep === 'MENU_CART' && (
              <MenuCartStep
                cart={cart}
                materials={materials}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateItemNote={handleUpdateItemNote}
                onClearCart={handleClearCart}
                onBack={() => setCurrentStep('CUSTOMER_TABLE')}
                onNext={() => setCurrentStep('DEDUCTION')}
              />
            )}

            {currentStep === 'DEDUCTION' && (
              <DeductionStep
                cart={cart}
                materials={materials}
                kitchenNote={kitchenNote}
                onChangeKitchenNote={setKitchenNote}
                onConfirm={handleConfirmOrderDeduction}
                onBack={() => setCurrentStep('MENU_CART')}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 'PAYMENT' && confirmedOrder && (
              <PaymentStep
                order={confirmedOrder}
                onProcessPayment={handleProcessPayment}
                onBack={() => setCurrentStep('DEDUCTION')}
                isProcessing={isSubmitting}
              />
            )}

            {currentStep === 'RECEIPT' && confirmedOrder && (
              <ReceiptStep
                order={confirmedOrder}
                onNewOrder={handleResetForNewOrder}
              />
            )}
          </div>
        )}

        {activeView === 'KITCHEN' && (
          <KitchenView
            orders={orders}
            currentUser={currentUser}
            onUpdateStatus={handleUpdateKitchenStatus}
          />
        )}

        {activeView === 'INVENTORY' && (
          <InventoryView
            materials={materials}
            ledger={ledger}
            currentUser={currentUser}
            onRestockTest={handleRestockTest}
          />
        )}

        {activeView === 'REPORTS' && (
          <DailySalesReport
            orders={orders}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* پاورقی ساده و بی‌آلایش */}
      <footer className="bg-white border-t border-[#e3e7ef] py-4 text-center text-xs text-[#8b94a5]">
        فود فکتوری · Food Factory POS & Inventory Control System · نسخه ۱.۰.۰ (MVP)
      </footer>
    </div>
  );
}
