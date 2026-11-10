import React, { useState } from 'react';
import { CartItem, RawMaterial } from '../domain/types';
import { explodeRecipeForOrder } from '../domain/inventory';
import { fa, formatMaterialAmount, nf } from '../domain/formatters';

interface DeductionStepProps {
  cart: CartItem[];
  materials: RawMaterial[];
  kitchenNote: string;
  onChangeKitchenNote: (note: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const DeductionStep: React.FC<DeductionStepProps> = ({
  cart,
  materials,
  kitchenNote,
  onChangeKitchenNote,
  onConfirm,
  onBack,
  isSubmitting,
}) => {
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  // انفجار بازگشتی رسپی اقلام سبد
  const { rows, hasDeficit, hasWarning } = explodeRecipeForOrder(cart, materials);

  return (
    <div className="space-y-6">
      {/* عنوان و بنر قاعده تغییرناپذیر Δ-01 */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#8b94a5]">مرحله ۳ از ۵ · انفجار رسپی و کسر اتمی</div>
            <h2 className="text-lg font-bold text-[#16202e]">
              جدول مغایرت‌سنجی مصرف مواد اولیه سفارش
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fff1e6] border border-[#e8590c]/30 text-xs font-bold text-[#e8590c]">
            <span>🔒 قاعده مصوب Δ-01:</span>
            <span>کسر مواد در لحظه تأیید سفارش (همین مرحله)</span>
          </div>
        </div>

        <p className="text-xs text-[#8b94a5] leading-relaxed">
          با کلیک بر روی دکمه «تأیید سفارش»، مقادیر ستون «مصرف این سفارش» بلافاصله از پایگاه داده و دفاتر انبار کسر گردیده و به عنوان تراکنش غیرقابل دستکاری در کاردکس ثبت خواهد شد.
        </p>
      </div>

      {/* هشدارها بر اساس قاعده Δ-05 (هشدار و نه مسدودسازی اجباری) */}
      {hasDeficit && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#dc2626] space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>⚠️</span>
            <span>هشدار کسری فیزیکی موجودی (Δ-05 / BR-OFF-03):</span>
          </div>
          <p className="leading-relaxed">
            یک یا چند قلم از مواد اولیه این سفارش، موجودی ثبتی کمتری نسبت به نیاز رسپی دارند. طبق قوانین رستوران، صندوق‌دار می‌تواند با پذیرش مسئولیت و تأیید کسری، سفارش را ثبت کند اما سیستم رویداد را در لاگ ثبت می‌کند.
          </p>
          <label className="flex items-center gap-2 pt-1 font-bold text-[#16202e] cursor-pointer">
            <input
              type="checkbox"
              checked={warningAcknowledged}
              onChange={(e) => setWarningAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#e8590c] focus:ring-[#e8590c]"
            />
            <span>مسئولیت ثبت سفارش با کسری موجودی را می‌پذیرم (تأیید صندوق‌دار)</span>
          </label>
        </div>
      )}

      {!hasDeficit && hasWarning && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#b45309] flex items-center gap-2 font-medium">
          <span>⚠️</span>
          <span>توجه: پس از ثبت این سفارش، موجودی برخی مواد اولیه به نقطه بحرانی سفارش مجدد خواهد رسید.</span>
        </div>
      )}

      {/* جدول تفصیلی انفجار رسپی (مطابق صفحه ۳ پروتوتایپ) */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-[#e3e7ef] text-[#8b94a5] font-bold">
              <tr>
                <th className="py-3 px-4">ماده اولیه</th>
                <th className="py-3 px-4">مکان فیزیکی (Δ-25)</th>
                <th className="py-3 px-4">لازم برای سفارش</th>
                <th className="py-3 px-4">موجودی فعلی</th>
                <th className="py-3 px-4">موجودی پس از کسر</th>
                <th className="py-3 px-4">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e7ef]">
              {rows.map((row) => {
                const isDeficit = row.status === 'DEFICIT';
                const isLow = row.status === 'WARNING_LOW';

                return (
                  <tr
                    key={row.materialId}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isDeficit ? 'bg-red-50/40' : isLow ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#16202e]">{row.name}</td>
                    <td className="py-3.5 px-4 text-[#8b94a5]">{row.location}</td>
                    <td className="py-3.5 px-4 font-bold text-[#e8590c] tabular-nums">
                      {formatMaterialAmount(row.required, row.unit)}
                    </td>
                    <td className="py-3.5 px-4 text-[#16202e] tabular-nums">
                      {formatMaterialAmount(row.currentStock, row.unit)}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-bold tabular-nums ${
                        isDeficit
                          ? 'text-[#dc2626]'
                          : isLow
                          ? 'text-[#b45309]'
                          : 'text-[#188a4d]'
                      }`}
                    >
                      {formatMaterialAmount(row.afterStock, row.unit)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          isDeficit
                            ? 'bg-red-100 text-[#dc2626]'
                            : isLow
                            ? 'bg-amber-100 text-[#b45309]'
                            : 'bg-emerald-100 text-[#188a4d]'
                        }`}
                      >
                        {row.statusMessage}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* یادداشت کلی سرآشپز برای سفارش */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-5 shadow-2xs space-y-2">
        <label htmlFor="general-kitchen-note" className="block text-xs font-bold text-[#16202e]">
          یادداشت سرآشپز برای کل سفارش (اختیاری)
        </label>
        <input
          id="general-kitchen-note"
          type="text"
          placeholder="مثال: سفارش VIP، سریع آماده شود، نان داغ همراه پیتزا"
          value={kitchenNote}
          onChange={(e) => onChangeKitchenNote(e.target.value)}
          className="w-full px-3.5 py-2 text-xs border border-[#e3e7ef] rounded-xl bg-slate-50 focus:bg-white focus:outline-2 focus:outline-[#e8590c]"
        />
      </div>

      {/* ناوبری دوطرفه */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-[#16202e] text-xs font-bold rounded-xl transition-colors"
        >
          → بازگشت به ویرایش منو
        </button>

        <button
          type="button"
          disabled={isSubmitting || (hasDeficit && !warningAcknowledged)}
          onClick={onConfirm}
          className={`py-3.5 px-8 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md ${
            isSubmitting || (hasDeficit && !warningAcknowledged)
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-[#e8590c] hover:bg-[#d04e0a] text-white'
          }`}
        >
          <span>{isSubmitting ? 'در حال ثبت تراکنش انبار...' : 'تأیید سفارش و کسر قطعی مواد اولیه'}</span>
          <span>←</span>
        </button>
      </div>
    </div>
  );
};
