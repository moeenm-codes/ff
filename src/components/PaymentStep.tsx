import React, { useState } from 'react';
import { Order, PaymentMethod, PaymentStatus } from '../domain/types';
import { generateQuickCashPresets, calculateChangeAmount } from '../domain/pricing';
import { fa, formatRial, nf } from '../domain/formatters';

interface PaymentStepProps {
  order: Order;
  onProcessPayment: (params: {
    method: PaymentMethod;
    totalAmount: number;
    cashAmount?: number;
    posAmount?: number;
    status: PaymentStatus;
    referenceCode?: string;
    traceNumber?: string;
  }) => void;
  onBack: () => void;
  isProcessing: boolean;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  order,
  onProcessPayment,
  onBack,
  isProcessing,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('POS');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('CONFIRMED');
  const [tenderedCash, setTenderedCash] = useState<number>(order.totalAmount);

  // حالت ترکیبی
  const [splitCash, setSplitCash] = useState<number>(Math.floor(order.totalAmount / 2));
  const [splitPos, setSplitPos] = useState<number>(order.totalAmount - Math.floor(order.totalAmount / 2));

  // کدهای پیگیری اختیاری یا شبیه‌سازی
  const [refCode, setRefCode] = useState(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [traceCode, setTraceCode] = useState(`TRC-${Math.floor(100000 + Math.random() * 900000)}`);

  // مبالغ میان‌بر نقدی بدون ارقام تکراری (رفع باگ شماره ۸ پروتوتایپ)
  const cashPresets = generateQuickCashPresets(order.totalAmount);
  const changeAmount = calculateChangeAmount(tenderedCash, order.totalAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (method === 'SPLIT' && splitCash + splitPos !== order.totalAmount) {
      alert('جمع مبالغ نقد و کارتخوان باید دقیقاً برابر با مبلغ سفارش باشد.');
      return;
    }

    onProcessPayment({
      method,
      totalAmount: order.totalAmount,
      cashAmount: method === 'CASH' ? order.totalAmount : method === 'SPLIT' ? splitCash : 0,
      posAmount: method === 'POS' ? order.totalAmount : method === 'SPLIT' ? splitPos : 0,
      status: paymentStatus,
      referenceCode: method !== 'CASH' ? refCode : undefined,
      traceNumber: method !== 'CASH' ? traceCode : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* سربرگ پرداخت و شماره سفارش درشت و متوالی */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e3e7ef]">
          <div>
            <div className="text-xs font-bold text-[#8b94a5]">مرحله ۴ از ۵ · تسویه و دریافت وجه</div>
            <h2 className="text-xl font-black text-[#16202e] flex items-center gap-2 mt-1">
              <span>تسویه فاکتور سفارش</span>
              <span className="text-[#e8590c] font-mono text-2xl font-black">
                #{fa(order.dailySequence)}
              </span>
            </h2>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-[#8b94a5]">مبلغ کل قابل پرداخت</div>
            <div className="text-2xl font-black text-[#e8590c] tabular-nums">
              {formatRial(order.totalAmount)}
            </div>
          </div>
        </div>

        {/* مشخصات سفارش */}
        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[#8b94a5] block">نوع سفارش:</span>
            <span className="font-bold text-[#16202e]">
              {order.orderType === 'DINE_IN'
                ? `سالن (میز ${fa(order.tableNumber)})`
                : order.orderType === 'TAKEAWAY'
                ? 'بیرون‌بر حضوری'
                : 'ارسال با پیک'}
            </span>
          </div>
          <div>
            <span className="text-[#8b94a5] block">مشتری:</span>
            <span className="font-bold text-[#16202e]">
              {order.customer ? order.customer.name : 'مشتری مهمان'}
            </span>
          </div>
          <div>
            <span className="text-[#8b94a5] block">تعداد اقلام:</span>
            <span className="font-bold text-[#16202e] tabular-nums">
              {fa(order.items.reduce((sum, i) => sum + i.quantity, 0))} قلم غذا
            </span>
          </div>
          <div>
            <span className="text-[#8b94a5] block">صندوق‌دار:</span>
            <span className="font-bold text-[#16202e]">{order.cashierName}</span>
          </div>
        </div>
      </div>

      {/* انتخاب شیوه پرداخت */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#16202e]">روش دریافت وجه</h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMethod('POS')}
            className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#e8590c] ${
              method === 'POS'
                ? 'border-[#e8590c] bg-[#fff1e6] ring-1 ring-[#e8590c]'
                : 'border-[#e3e7ef] hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl">💳</span>
            <span className="text-xs font-bold text-[#16202e]">کارتخوان بانکی (POS)</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('CASH')}
            className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#e8590c] ${
              method === 'CASH'
                ? 'border-[#e8590c] bg-[#fff1e6] ring-1 ring-[#e8590c]'
                : 'border-[#e3e7ef] hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl">💵</span>
            <span className="text-xs font-bold text-[#16202e]">نقدی (کشوی پول)</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('SPLIT')}
            className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#e8590c] ${
              method === 'SPLIT'
                ? 'border-[#e8590c] bg-[#fff1e6] ring-1 ring-[#e8590c]'
                : 'border-[#e3e7ef] hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl">⚖️</span>
            <span className="text-xs font-bold text-[#16202e]">ترکیبی (نقد + کارت)</span>
          </button>
        </div>

        {/* جزئیات پرداخت بر اساس روش انتخابی */}
        {method === 'POS' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-[#e3e7ef] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b94a5]">دستگاه متصل:</span>
              <span className="font-bold text-[#16202e]">کارتخوان شبکه صادرات (پایانه ۰۱)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ref-code" className="block text-[11px] text-[#8b94a5] mb-1">
                  کد مرجع بانکی (RRN)
                </label>
                <input
                  id="ref-code"
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-[#e3e7ef] rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label htmlFor="trace-code" className="block text-[11px] text-[#8b94a5] mb-1">
                  شماره پیگیری (Trace)
                </label>
                <input
                  id="trace-code"
                  type="text"
                  value={traceCode}
                  onChange={(e) => setTraceCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-[#e3e7ef] rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {method === 'CASH' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-[#e3e7ef] space-y-4">
            <div>
              <span className="block text-xs font-bold text-[#16202e] mb-2">
                کلیدهای میان‌بر مبلغ دریافتی (رفع باگ شماره ۸ پروتوتایپ):
              </span>
              <div className="flex flex-wrap gap-2">
                {cashPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTenderedCash(preset)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      tenderedCash === preset
                        ? 'bg-[#e8590c] text-white border-[#e8590c]'
                        : 'bg-white text-[#16202e] border-[#e3e7ef] hover:bg-slate-100'
                    }`}
                  >
                    {formatRial(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label htmlFor="tendered-cash" className="block text-xs text-[#8b94a5] mb-1">
                  مبلغ دریافتی دستی (ریال):
                </label>
                <input
                  id="tendered-cash"
                  type="number"
                  step="50000"
                  min={order.totalAmount}
                  value={tenderedCash}
                  onChange={(e) => setTenderedCash(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-bold border border-[#e3e7ef] rounded-xl bg-white font-mono"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#e3e7ef] flex flex-col justify-center">
                <span className="text-xs text-[#8b94a5]">باقی‌مانده قابل برگشت به مشتری:</span>
                <span className="text-lg font-black text-[#188a4d] tabular-nums mt-0.5">
                  {formatRial(changeAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {method === 'SPLIT' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-[#e3e7ef] space-y-3">
            <div className="text-xs text-[#8b94a5] leading-relaxed">
              مبلغ کل فاکتور ({formatRial(order.totalAmount)}) را بین وجه نقد و کارتخوان تقسیم نمایید:
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="split-cash" className="block text-xs font-bold text-[#16202e] mb-1">
                  سهم نقدی (ریال):
                </label>
                <input
                  id="split-cash"
                  type="number"
                  value={splitCash}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    setSplitCash(c);
                    setSplitPos(Math.max(0, order.totalAmount - c));
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-[#e3e7ef] rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label htmlFor="split-pos" className="block text-xs font-bold text-[#16202e] mb-1">
                  سهم کارتخوان (ریال):
                </label>
                <input
                  id="split-pos"
                  type="number"
                  value={splitPos}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setSplitPos(p);
                    setSplitCash(Math.max(0, order.totalAmount - p));
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-[#e3e7ef] rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* وضعیت ۴ مرحله‌ای پرداخت (FR-PAY-04 و قاعده ۳ مگاپرامپت) */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#16202e]">
            وضعیت تراکنش پرداخت (FR-PAY-04 چهار مرحله‌ای)
          </h3>
          <span className="text-xs text-[#8b94a5]">حالت سوم: Unknown (نامشخص)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setPaymentStatus('CONFIRMED')}
            className={`p-3 rounded-xl border text-right transition-all ${
              paymentStatus === 'CONFIRMED'
                ? 'border-[#188a4d] bg-[#e8f7ee] text-[#188a4d] font-bold ring-1 ring-[#188a4d]'
                : 'border-[#e3e7ef] text-[#16202e] hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold">تأیید شد (Confirmed) ✓</div>
            <div className="text-[10px] text-[#8b94a5] mt-1">تراکنش موفقیت‌آمیز</div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentStatus('PENDING')}
            className={`p-3 rounded-xl border text-right transition-all ${
              paymentStatus === 'PENDING'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-500'
                : 'border-[#e3e7ef] text-[#16202e] hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold">در انتظار (Pending) ⏳</div>
            <div className="text-[10px] text-[#8b94a5] mt-1">درگاه در حال پردازش</div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentStatus('UNKNOWN')}
            className={`p-3 rounded-xl border text-right transition-all ${
              paymentStatus === 'UNKNOWN'
                ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold ring-1 ring-amber-500'
                : 'border-[#e3e7ef] text-[#16202e] hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold">نامشخص (Unknown) ❓</div>
            <div className="text-[10px] text-[#8b94a5] mt-1">جهت تطبیق مغایرت شبانه</div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentStatus('FAILED')}
            className={`p-3 rounded-xl border text-right transition-all ${
              paymentStatus === 'FAILED'
                ? 'border-red-500 bg-red-50 text-red-700 font-bold ring-1 ring-red-500'
                : 'border-[#e3e7ef] text-[#16202e] hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold">ناموفق (Failed) ✕</div>
            <div className="text-[10px] text-[#8b94a5] mt-1">خطای خط یا کارت بانکی</div>
          </button>
        </div>

        {paymentStatus === 'UNKNOWN' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-[#b45309] leading-relaxed">
            <span className="font-bold">یادداشت ثبت وضعیت نامشخص (FR-PAY-04):</span> این وضعیت برای مواردی است که پول از حساب مشتری کسر شده اما رسید کارتخوان چاپ نشده است. فیش با شناسه تعلیقی صادر و در فهرست مغایرت‌های مالی قرار می‌گیرد.
          </div>
        )}
      </div>

      {/* کلیدهای اقدام نهایی */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-[#16202e] text-xs font-bold rounded-xl transition-colors"
        >
          → بازگشت به کسر مواد
        </button>

        <button
          type="submit"
          disabled={isProcessing}
          className="py-3.5 px-8 bg-[#e8590c] hover:bg-[#d04e0a] text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <span>{isProcessing ? 'در حال صدور فیش و ثبت...' : 'ثبت قطعی پرداخت و صدور فیش‌ها'}</span>
          <span>←</span>
        </button>
      </div>
    </form>
  );
};
