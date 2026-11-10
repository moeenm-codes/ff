import React, { useState } from 'react';
import { Customer, OrderType, RestaurantTable } from '../domain/types';
import { INITIAL_CUSTOMERS } from '../domain/seed';
import { fa } from '../domain/formatters';

interface CustomerTableStepProps {
  orderType: OrderType;
  onChangeOrderType: (type: OrderType) => void;
  selectedTableNumber?: number;
  onSelectTable: (tableNum?: number) => void;
  selectedCustomer?: Customer;
  onSelectCustomer: (customer?: Customer) => void;
  isGuest: boolean;
  onToggleGuest: (isGuest: boolean) => void;
  tables: RestaurantTable[];
  onNext: () => void;
}

export const CustomerTableStep: React.FC<CustomerTableStepProps> = ({
  orderType,
  onChangeOrderType,
  selectedTableNumber,
  onSelectTable,
  selectedCustomer,
  onSelectCustomer,
  isGuest,
  onToggleGuest,
  tables,
  onNext,
}) => {
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerList, setCustomerList] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredCustomers = customerList.filter(
    (c) => c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setErrorMsg('نام و شماره تلفن مشتری الزامی است.');
      return;
    }
    const created: Customer = {
      id: `CUST-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      orderCount: 1,
      lastVisit: 'امروز',
    };
    setCustomerList([created, ...customerList]);
    onSelectCustomer(created);
    onToggleGuest(false);
    setNewCustName('');
    setNewCustPhone('');
    setErrorMsg('');
  };

  const canProceed = () => {
    if (orderType === 'DINE_IN' && !selectedTableNumber) return false;
    return true; // مشتری می‌تواند مهمان باشد (رفع باگ شماره ۵)
  };

  return (
    <div className="space-y-6">
      {/* مرحله ۱: انتخاب نوع سفارش */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs">
        <div className="text-xs font-bold text-[#8b94a5] mb-3">مرحله ۱ از ۵ · تعیین نوع سفارش</div>
        <h2 className="text-lg font-bold text-[#16202e] mb-4">نحوه ارائه سفارش به مشتری</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onChangeOrderType('DINE_IN')}
            className={`p-4 rounded-xl border text-right transition-all flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-[#e8590c] ${
              orderType === 'DINE_IN'
                ? 'border-[#e8590c] bg-[#fff1e6] ring-1 ring-[#e8590c]'
                : 'border-[#e3e7ef] hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-3xl">🍽️</span>
            <div>
              <div className="font-bold text-sm text-[#16202e]">سفارش سالن (میز)</div>
              <div className="text-xs text-[#8b94a5]">سرو غذا داخل رستوران با شماره میز</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeOrderType('TAKEAWAY');
              onSelectTable(undefined);
            }}
            className={`p-4 rounded-xl border text-right transition-all flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-[#e8590c] ${
              orderType === 'TAKEAWAY'
                ? 'border-[#e8590c] bg-[#fff1e6] ring-1 ring-[#e8590c]'
                : 'border-[#e3e7ef] hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-3xl">🛍️</span>
            <div>
              <div className="font-bold text-sm text-[#16202e]">بیرون‌بر حضوری</div>
              <div className="text-xs text-[#8b94a5]">بسته‌بندی در جعبه بیرون‌بر و تحویل به مشتری</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeOrderType('DELIVERY');
              onSelectTable(undefined);
            }}
            className={`p-4 rounded-xl border text-right transition-all flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-[#e8590c] ${
              orderType === 'DELIVERY'
                ? 'border-[#e8590c] bg-[#fff1e6] ring-1 ring-[#e8590c]'
                : 'border-[#e3e7ef] hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-3xl">🛵</span>
            <div>
              <div className="font-bold text-sm text-[#16202e]">ارسال با پیک</div>
              <div className="text-xs text-[#8b94a5]">ارسال به آدرس مشتری با پیک موتوری</div>
            </div>
          </button>
        </div>
      </div>

      {/* مرحله ۲: نقشه ۸ میز رستوران (فقط در صورت سفارش سالن) */}
      {orderType === 'DINE_IN' && (
        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-[#8b94a5]">مرحله ۲ · تخصیص میز</div>
              <h3 className="text-base font-bold text-[#16202e]">انتخاب میز سالن غذاخوری</h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#8b94a5]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#188a4d]" /> آزاد
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> اشغال (غیرقابل انتخاب)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" /> رزرو
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {tables.map((table) => {
              const isOccupied = table.status === 'OCCUPIED';
              const isSelected = selectedTableNumber === table.number;

              return (
                <button
                  key={table.id}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => onSelectTable(table.number)}
                  className={`p-4 rounded-xl border text-right transition-all relative ${
                    isOccupied
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-65'
                      : isSelected
                      ? 'border-[#e8590c] bg-[#fff1e6] ring-2 ring-[#e8590c]'
                      : 'border-[#e3e7ef] hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  aria-label={`میز شماره ${fa(table.number)} ظرفیت ${fa(table.capacity)} نفر وضعیت ${
                    isOccupied ? 'اشغال' : table.status === 'RESERVED' ? 'رزرو' : 'آزاد'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#8b94a5]">
                      ظرفیت: {fa(table.capacity)} نفر
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isOccupied
                          ? 'bg-red-100 text-[#dc2626]'
                          : table.status === 'RESERVED'
                          ? 'bg-amber-100 text-[#b45309]'
                          : 'bg-emerald-100 text-[#188a4d]'
                      }`}
                    >
                      {isOccupied ? 'اشغال' : table.status === 'RESERVED' ? 'رزرو' : 'آزاد'}
                    </span>
                  </div>

                  <div className="text-base font-bold text-[#16202e]">{table.name}</div>
                  {isOccupied && table.currentOrderId && (
                    <div className="text-[11px] text-[#dc2626] mt-1 font-mono">
                      در حال سرو ({table.currentOrderId})
                    </div>
                  )}
                  {isSelected && (
                    <div className="text-xs font-bold text-[#e8590c] mt-2">میز انتخاب‌شده ✓</div>
                  )}
                </button>
              );
            })}
          </div>

          {!selectedTableNumber && (
            <p className="text-xs text-[#dc2626] mt-3 font-medium">
              * جهت ادامه، لطفاً یکی از میزهای آزاد را انتخاب نمایید.
            </p>
          )}
        </div>
      )}

      {/* مرحله ۳: اطلاعات مشتری یا سفارش مهمان */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-[#8b94a5]">مرحله ۳ · مشخصات مشتری</div>
            <h3 className="text-base font-bold text-[#16202e]">انتخاب یا ثبت مشتری (اختیاری)</h3>
          </div>

          {/* کلید سفارش مهمان - حل باگ شماره ۵ پروتوتایپ */}
          <button
            type="button"
            onClick={() => {
              onToggleGuest(!isGuest);
              if (!isGuest) onSelectCustomer(undefined);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              isGuest
                ? 'bg-[#188a4d] text-white border-[#188a4d]'
                : 'bg-slate-50 text-[#16202e] border-[#e3e7ef] hover:bg-slate-100'
            }`}
          >
            {isGuest ? 'سفارش مهمان (بدون نام) فعال است ✓' : 'تغییر به سفارش مهمان سریع'}
          </button>
        </div>

        {isGuest ? (
          <div className="p-4 bg-[#e8f7ee] rounded-xl border border-[#188a4d]/20 text-xs text-[#188a4d] leading-relaxed">
            <span className="font-bold">حالت مهمان فعال شد:</span> نیازی به ثبت نام و شماره تلفن مشتری نیست. فاکتور با عنوان «مشتری مهمان» صادر خواهد شد.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* جستجو و انتخاب مشتری */}
            <div>
              <label htmlFor="customer-search" className="block text-xs font-bold text-[#16202e] mb-1.5">
                جستجو در مشتریان وفادار
              </label>
              <input
                id="customer-search"
                type="text"
                placeholder="نام یا شماره موبایل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-[#e3e7ef] rounded-xl bg-slate-50 focus:bg-white focus:outline-2 focus:outline-[#e8590c]"
              />

              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pl-1">
                {filteredCustomers.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(c);
                        onToggleGuest(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-right transition-colors ${
                        isSelected
                          ? 'border-[#e8590c] bg-[#fff1e6]'
                          : 'border-[#e3e7ef] hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#16202e]">{c.name}</div>
                        <div className="text-[11px] text-[#8b94a5] font-mono">{fa(c.phone)}</div>
                      </div>
                      <div className="text-left text-[11px] text-[#8b94a5]">
                        <div>{fa(c.orderCount)} سفارش</div>
                        {isSelected && <div className="text-[#e8590c] font-bold">انتخاب شد ✓</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ثبت مشتری جدید سریع */}
            <form onSubmit={handleCreateCustomer} className="border-t md:border-t-0 md:border-r border-[#e3e7ef] md:pr-6 pt-4 md:pt-0">
              <div className="text-xs font-bold text-[#16202e] mb-3">افزودن سریع مشتری جدید</div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="new-name" className="block text-[11px] text-[#8b94a5] mb-1">
                    نام و نام خانوادگی
                  </label>
                  <input
                    id="new-name"
                    type="text"
                    placeholder="مثال: کیانوش دانا"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#e3e7ef] rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="new-phone" className="block text-[11px] text-[#8b94a5] mb-1">
                    شماره تماس همراه
                  </label>
                  <input
                    id="new-phone"
                    type="text"
                    placeholder="۰۹۱۲..."
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#e3e7ef] rounded-xl"
                  />
                </div>
                {errorMsg && <p className="text-xs text-[#dc2626]">{errorMsg}</p>}
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  ثبت مشتری و انتخاب در سفارش
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* دکمه حرکت به مرحله منو */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          disabled={!canProceed()}
          onClick={onNext}
          className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            canProceed()
              ? 'bg-[#e8590c] hover:bg-[#d04e0a] text-white shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>ادامه به منو و انتخاب اقلام غذایی</span>
          <span>←</span>
        </button>
      </div>
    </div>
  );
};
