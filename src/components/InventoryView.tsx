import React, { useState } from 'react';
import { RawMaterial, StockLedgerEntry, UserProfile } from '../domain/types';
import { fa, formatDateTime, formatMaterialAmount } from '../domain/formatters';

interface InventoryViewProps {
  materials: RawMaterial[];
  ledger: StockLedgerEntry[];
  currentUser: UserProfile;
  onRestockTest: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  materials,
  ledger,
  currentUser,
  onRestockTest,
}) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LEDGER'>('STOCK');

  return (
    <div className="space-y-6">
      {/* سربرگ انبارداری */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#4f46e5]">پنل انبارداری و ردیابی رسپی</div>
          <h2 className="text-xl font-bold text-[#16202e] flex items-center gap-2 mt-0.5">
            <span>مدیریت موجودی مواد اولیه و کاردکس (Stock Ledger)</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRestockTest}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#16202e] text-xs font-bold rounded-xl transition-colors"
          >
            ↻ بازنشانی و شارژ موجودی اولیه انبار
          </button>
        </div>
      </div>

      {/* تب‌های جابجایی بین کاردکس و موجودی فعلی */}
      <div className="flex items-center gap-2 border-b border-[#e3e7ef] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('STOCK')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'STOCK'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'text-[#8b94a5] hover:text-[#16202e] hover:bg-slate-100'
          }`}
        >
          موجودی لحظه‌ای مواد به تفکیک موقعیت فیزیکی (Δ-25)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'LEDGER'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'text-[#8b94a5] hover:text-[#16202e] hover:bg-slate-100'
          }`}
        >
          دفتر گردش کالا / کاردکس غیرقابل ویرایش (Append-Only)
        </button>
      </div>

      {activeTab === 'STOCK' ? (
        <div className="bg-white rounded-2xl border border-[#e3e7ef] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-[#e3e7ef] text-[#8b94a5] font-bold">
                <tr>
                  <th className="py-3 px-4">کد کالا</th>
                  <th className="py-3 px-4">نام ماده اولیه</th>
                  <th className="py-3 px-4">موقعیت فیزیکی (Δ-25)</th>
                  <th className="py-3 px-4">موجودی فعلی</th>
                  <th className="py-3 px-4">حداقل نقطه سفارش</th>
                  <th className="py-3 px-4">وضعیت موجودی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e7ef]">
                {materials.map((mat) => {
                  const isDeficit = mat.stock <= 0;
                  const isLow = mat.stock <= mat.minThreshold;

                  const locationTitle =
                    mat.location === 'KITCHEN_STOCK'
                      ? 'موجودی دم‌دست آشپزخانه'
                      : mat.location === 'PREP'
                      ? 'میز آماده‌سازی غذا'
                      : 'انبار مرکزی خشک/سردخانه';

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#8b94a5]">{mat.code}</td>
                      <td className="py-3.5 px-4 font-bold text-[#16202e]">{mat.name}</td>
                      <td className="py-3.5 px-4 text-[#8b94a5]">{locationTitle}</td>
                      <td className="py-3.5 px-4 font-black text-sm text-[#16202e] tabular-nums">
                        {formatMaterialAmount(mat.stock, mat.unit)}
                      </td>
                      <td className="py-3.5 px-4 text-[#8b94a5] tabular-nums">
                        {formatMaterialAmount(mat.minThreshold, mat.unit)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                            isDeficit
                              ? 'bg-red-100 text-[#dc2626]'
                              : isLow
                              ? 'bg-amber-100 text-[#b45309]'
                              : 'bg-emerald-100 text-[#188a4d]'
                          }`}
                        >
                          {isDeficit ? 'اتمام موجودی' : isLow ? 'نیازمند تأمین' : 'مطلوب'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e3e7ef] shadow-2xs overflow-hidden">
          {ledger.length === 0 ? (
            <div className="p-12 text-center text-[#8b94a5] text-xs">
              هنوز هیچ تراکنش کسر یا ورود موادی در کاردکس ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-[#e3e7ef] text-[#8b94a5] font-bold">
                  <tr>
                    <th className="py-3 px-4">زمان ثبت</th>
                    <th className="py-3 px-4">ماده اولیه</th>
                    <th className="py-3 px-4">میزان تغییر</th>
                    <th className="py-3 px-4">موجودی پس از تغییر</th>
                    <th className="py-3 px-4">علت تراکنش</th>
                    <th className="py-3 px-4">شماره ارجاع</th>
                    <th className="py-3 px-4">اپراتور مسئول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e7ef]">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-[#8b94a5] tabular-nums">
                        {formatDateTime(entry.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16202e]">{entry.materialName}</td>
                      <td
                        className={`py-3 px-4 font-bold font-mono tabular-nums ${
                          entry.changeAmount < 0 ? 'text-[#dc2626]' : 'text-[#188a4d]'
                        }`}
                      >
                        {fa(entry.changeAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16202e] tabular-nums">
                        {fa(entry.balanceAfter)}
                      </td>
                      <td className="py-3 px-4 text-[#8b94a5]">
                        {entry.reason === 'ORDER_CONSUMPTION'
                          ? 'مصرف بر اساس رسپی سفارش'
                          : entry.reason}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#e8590c]">
                        {entry.referenceId || '-'}
                      </td>
                      <td className="py-3 px-4 text-[#16202e]">{entry.operatorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
