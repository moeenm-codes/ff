import React, { useRef } from 'react';
import { Order } from '../domain/types';
import { fa, formatDateTime, formatRial, formatTime } from '../domain/formatters';

interface ReceiptStepProps {
  order: Order;
  onNewOrder: () => void;
}

export const ReceiptStep: React.FC<ReceiptStepProps> = ({ order, onNewOrder }) => {
  const customerReceiptRef = useRef<HTMLDivElement>(null);
  const kitchenReceiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = (type: 'CUSTOMER' | 'KITCHEN') => {
    // چاپ با باز کردن پنجره چاپ استاندارد مرورگر
    window.print();
  };

  const isUnknownPayment = order.payment?.status === 'UNKNOWN';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* سربرگ موفقیت */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7ee] text-[#188a4d] flex items-center justify-center text-2xl font-bold">
            ✓
          </div>
          <div>
            <div className="text-xs font-bold text-[#188a4d]">سفارش با موفقیت نهایی و ثبت شد</div>
            <h2 className="text-xl font-black text-[#16202e] flex items-center gap-2 mt-0.5">
              <span>شماره سفارش:</span>
              <span className="font-mono text-[#e8590c] text-2xl font-black">
                #{fa(order.dailySequence)}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePrint('CUSTOMER')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#16202e] text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <span>🖨️</span>
            <span>چاپ رسید مشتری</span>
          </button>
          <button
            type="button"
            onClick={onNewOrder}
            className="px-6 py-2.5 bg-[#e8590c] hover:bg-[#d04e0a] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            + ثبت سفارش جدید (Reset کامل)
          </button>
        </div>
      </div>

      {/* دو رسید کنار هم (رسید مشتری ۸۰mm با مبالغ + فیش آشپزخانه بدون مبالغ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* ۱. رسید مشتری ۸۰ میلی‌متری حرارتی */}
        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-xs relative">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e3e7ef]">
            <span className="text-xs font-bold text-[#8b94a5]">رسانه ۱ · رسید مشتری ۸۰mm</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#16202e]">
              همراه با مبالغ (FR-PAY-07)
            </span>
          </div>

          <div
            ref={customerReceiptRef}
            className="w-full max-w-[320px] mx-auto bg-white p-5 border border-dashed border-slate-300 rounded-xl text-center text-xs font-mono text-[#16202e] shadow-2xs space-y-3"
            style={{ fontFamily: 'Tahoma, monospace' }}
          >
            {/* سربرگ رسید */}
            <div className="space-y-1">
              <div className="text-base font-black tracking-tight text-[#16202e]">
                رستوران فود فکتوری
              </div>
              <div className="text-[11px] text-[#8b94a5]">شعبه مرکزی · سیستم فروش Food Factory</div>
              <div className="text-2xl font-black text-[#e8590c] pt-1">
                #{fa(order.dailySequence)}
              </div>
            </div>

            {/* اطلاعات متادیتا */}
            <div className="text-[11px] border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-right">
              <div className="flex justify-between">
                <span className="text-[#8b94a5]">زمان:</span>
                <span className="tabular-nums">{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b94a5]">نوع سفارش:</span>
                <span className="font-bold">
                  {order.orderType === 'DINE_IN'
                    ? `سالن (میز ${fa(order.tableNumber)})`
                    : order.orderType === 'TAKEAWAY'
                    ? 'بیرون‌بر'
                    : 'پیک موتوری'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b94a5]">مشتری:</span>
                <span>{order.customer ? order.customer.name : 'مشتری مهمان'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b94a5]">صندوق‌دار:</span>
                <span>{order.cashierName}</span>
              </div>
            </div>

            {/* جدول اقلام */}
            <div className="space-y-1.5 text-right text-[11px]">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[#8b94a5]">
                <span>شرح غذا</span>
                <span>تعداد × فی</span>
                <span>جمع (ریال)</span>
              </div>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-0.5">
                  <div className="flex-1">
                    <span className="font-bold">{item.menuItem.name}</span>
                    {item.note && (
                      <div className="text-[10px] text-amber-700">({item.note})</div>
                    )}
                  </div>
                  <span className="tabular-nums px-2">
                    {fa(item.quantity)} × {fa(Math.round(item.unitPrice / 1000))}k
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatRial(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* جمع مبالغ (بدون مالیات طبق Δ-28) */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right text-[11px]">
              <div className="flex justify-between text-[#8b94a5]">
                <span>مالیات و ارزش افزوده (Δ-28):</span>
                <span>۰ ریال</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#16202e] pt-1 border-t border-slate-200">
                <span>مبلغ قابل پرداخت:</span>
                <span className="text-[#e8590c] tabular-nums">{formatRial(order.totalAmount)}</span>
              </div>
            </div>

            {/* وضعیت پرداخت */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-right text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>روش پرداخت:</span>
                <span className="font-bold">
                  {order.payment?.method === 'CASH'
                    ? 'وجه نقد'
                    : order.payment?.method === 'POS'
                    ? 'کارتخوان بانکی'
                    : 'پرداخت ترکیبی'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>وضعیت:</span>
                <span
                  className={`font-bold ${
                    isUnknownPayment
                      ? 'text-[#b45309]'
                      : order.payment?.status === 'CONFIRMED'
                      ? 'text-[#188a4d]'
                      : 'text-[#dc2626]'
                  }`}
                >
                  {isUnknownPayment
                    ? 'نامشخص (جهت مغایرت‌گیری) ❓'
                    : order.payment?.status === 'CONFIRMED'
                    ? 'تأیید شد و تسویه شد ✓'
                    : 'ناموفق'}
                </span>
              </div>
              {order.payment?.traceNumber && (
                <div className="flex justify-between text-[#8b94a5]">
                  <span>شماره پیگیری:</span>
                  <span className="font-mono">{order.payment.traceNumber}</span>
                </div>
              )}
            </div>

            {/* بارکد شبیه‌سازی‌شده */}
            <div className="pt-2 text-center">
              <div className="tracking-[6px] text-xs font-mono text-slate-400">
                ||| | ||||| || ||| ||||
              </div>
              <div className="text-[10px] text-[#8b94a5] mt-1">با تشکر از انتخاب فود فکتوری</div>
            </div>
          </div>
        </div>

        {/* ۲. فیش آشپزخانه (KOT - Kitchen Order Ticket) - بدون مبالغ */}
        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-xs relative">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e3e7ef]">
            <span className="text-xs font-bold text-[#8b94a5]">رسانه ۲ · فیش سرآشپز (KOT)</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e8f7ee] text-[#188a4d]">
              بدون مبالغ (قاعده اجباری FR-ORD-11)
            </span>
          </div>

          <div
            ref={kitchenReceiptRef}
            className="w-full max-w-[320px] mx-auto bg-amber-50/40 p-5 border-2 border-dashed border-amber-300 rounded-xl text-right text-xs text-[#16202e] shadow-2xs space-y-4"
          >
            {/* سربرگ آشپزخانه با شماره سفارش غول‌پیکر */}
            <div className="text-center pb-2 border-b-2 border-amber-300 space-y-1">
              <div className="text-xs font-bold text-[#b45309]">سفارش پخت آشپزخانه (KOT)</div>
              <div className="text-4xl font-black text-[#16202e] font-mono tracking-tight">
                #{fa(order.dailySequence)}
              </div>
              <div className="text-sm font-bold text-[#e8590c]">
                {order.orderType === 'DINE_IN'
                  ? `میز شماره ${fa(order.tableNumber)} (سالن)`
                  : order.orderType === 'TAKEAWAY'
                  ? 'بسته‌بندی بیرون‌بر'
                  : 'پیک موتوری'}
              </div>
              <div className="text-[11px] text-[#8b94a5]">
                ثبت: {formatTime(order.createdAt)} · صندوق: {order.cashierName}
              </div>
            </div>

            {/* یادداشت کلی سرآشپز */}
            {order.kitchenNote && (
              <div className="p-2 bg-amber-100 rounded-lg text-xs font-bold text-[#b45309]">
                ⚠️ یادداشت سفارش: {order.kitchenNote}
              </div>
            )}

            {/* لیست اقلام بدون مبالغ با فونت درشت و یادداشت‌ها */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#8b94a5] border-b border-amber-200 pb-1">
                اقلام غذایی جهت طبخ:
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-white rounded-lg border border-amber-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#16202e]">
                      {item.menuItem.name}
                    </span>
                    <span className="text-base font-black px-2 py-0.5 bg-[#e8590c] text-white rounded-md tabular-nums">
                      {fa(item.quantity)} عدد
                    </span>
                  </div>
                  {/* یادداشت ویژه سرآشپز */}
                  {item.note && (
                    <div className="text-xs font-bold text-[#b45309] bg-amber-50 p-1 rounded">
                      👉 {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t-2 border-amber-300 text-center text-[10px] text-[#8b94a5]">
              زمان آماده‌سازی پیش‌فرض: ۱۵ دقیقه
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
