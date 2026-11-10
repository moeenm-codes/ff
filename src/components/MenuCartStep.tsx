import React, { useState } from 'react';
import { CartItem, MenuItem, RawMaterial } from '../domain/types';
import { MENU_CATEGORIES, MENU_ITEMS } from '../domain/seed';
import { calculateAvailableToAdd } from '../domain/inventory';
import { calculateCartTotal } from '../domain/pricing';
import { fa, formatRial } from '../domain/formatters';

interface MenuCartStepProps {
  cart: CartItem[];
  materials: RawMaterial[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onUpdateItemNote: (itemId: string, note: string) => void;
  onClearCart: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const MenuCartStep: React.FC<MenuCartStepProps> = ({
  cart,
  materials,
  onAddToCart,
  onUpdateQuantity,
  onUpdateItemNote,
  onClearCart,
  onBack,
  onNext,
}) => {
  const [selectedCat, setSelectedCat] = useState('CAT-ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCat = selectedCat === 'CAT-ALL' || item.categoryId === selectedCat;
    const matchesSearch =
      item.name.includes(searchQuery) ||
      item.description.includes(searchQuery) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartTotal = calculateCartTotal(cart);
  const totalItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const openNoteModal = (item: CartItem) => {
    setEditingNoteItemId(item.id);
    setTempNoteText(item.note || '');
  };

  const saveNote = () => {
    if (editingNoteItemId) {
      onUpdateItemNote(editingNoteItemId, tempNoteText.trim());
      setEditingNoteItemId(null);
      setTempNoteText('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ستون راست: دسته‌بندی‌ها، جستجو و کارت‌های غذا (۸ ستون در دسکتاپ) */}
      <div className="lg:col-span-8 space-y-4">
        {/* نوار جستجو و فیلتر دسته‌بندی */}
        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[#16202e] whitespace-nowrap">
              منوی غذا و پایش لحظه‌ای مواد اولیه
            </h2>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="جستجوی نام، کد یا توضیحات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-[#e3e7ef] rounded-xl bg-slate-50 focus:bg-white focus:outline-2 focus:outline-[#e8590c]"
              />
            </div>
          </div>

          {/* تب‌های دسته‌بندی */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            {MENU_CATEGORIES.map((cat) => {
              const isActive = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#e8590c] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-[#16202e]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* شبکه کارت‌های منو (۱۲ آیتم با نمایش زنده موجودی قابل فروش) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            // محاسبه حیاتی موجودی قابل فروش با در نظر گرفتن کل سبد جاری
            const availableToAdd = calculateAvailableToAdd(item, materials, cart);
            const isOutOfStock = availableToAdd <= 0;
            const inCartQuantity = cart.find((c) => c.menuItem.id === item.id)?.quantity || 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                  isOutOfStock
                    ? 'border-red-200 bg-red-50/20'
                    : inCartQuantity > 0
                    ? 'border-[#e8590c]/40 ring-1 ring-[#e8590c]/30 shadow-xs'
                    : 'border-[#e3e7ef] hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.imageEmoji}</span>
                      <div>
                        <div className="text-xs font-mono text-[#8b94a5]">{item.code}</div>
                        <h3 className="font-bold text-sm text-[#16202e]">{item.name}</h3>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff1e6] text-[#e8590c] border border-[#e8590c]/20">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#8b94a5] line-clamp-2 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#e3e7ef]">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs text-[#8b94a5]">قیمت:</span>
                    <span className="text-sm font-bold text-[#16202e] tabular-nums">
                      {formatRial(item.price)}
                    </span>
                  </div>

                  {/* پایش موجودی قابل فروش با احتساب کل سبد (رفع باگ شماره ۱) */}
                  <div className="flex items-center justify-between mb-3 text-[11px]">
                    <span className="text-[#8b94a5]">موجودی قابل سفارش:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        isOutOfStock
                          ? 'text-[#dc2626]'
                          : availableToAdd <= 3
                          ? 'text-[#b45309]'
                          : 'text-[#188a4d]'
                      }`}
                    >
                      {isOutOfStock ? 'اتمام موجودی مواد' : `${fa(availableToAdd)} عدد`}
                    </span>
                  </div>

                  {/* کلیدهای سفارش */}
                  {inCartQuantity > 0 ? (
                    <div className="flex items-center justify-between bg-slate-50 border border-[#e3e7ef] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-[#e3e7ef] font-bold text-sm text-[#dc2626] hover:bg-red-50 flex items-center justify-center transition-colors"
                        aria-label={`کاهش تعداد ${item.name}`}
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-[#16202e] tabular-nums">
                        {fa(inCartQuantity)} عدد در سبد
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => onAddToCart(item)}
                        className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#e8590c] text-white hover:bg-[#d04e0a]'
                        }`}
                        aria-label={`افزودن تعداد ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onAddToCart(item)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-[#e8590c] hover:bg-[#d04e0a] text-white shadow-xs'
                      }`}
                    >
                      <span>+</span>
                      <span>افزودن به سبد</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ستون چپ: سبد خرید زنده و یادداشت‌های آیتم‌ها (۴ ستون در دسکتاپ) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e3e7ef] p-5 shadow-2xs sticky top-20">
        <div className="flex items-center justify-between pb-3 border-b border-[#e3e7ef] mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h3 className="font-bold text-sm text-[#16202e]">سبد سفارش جاری</h3>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[11px] text-[#dc2626] hover:underline font-bold"
            >
              پاک‌کردن سبد
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-4xl text-slate-300">🍽️</div>
            <p className="text-xs text-[#8b94a5]">سبد خرید خالی است.</p>
            <p className="text-[11px] text-[#8b94a5]">لطفاً غذاهای مورد نظر را از منو انتخاب کنید.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pl-1">
            {cart.map((cartItem) => {
              const itemTotal = cartItem.unitPrice * cartItem.quantity;
              return (
                <div
                  key={cartItem.id}
                  className="p-3 bg-slate-50 border border-[#e3e7ef] rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-[#16202e]">{cartItem.menuItem.name}</div>
                      <div className="text-[11px] text-[#8b94a5] font-mono tabular-nums">
                        {formatRial(cartItem.unitPrice)} × {fa(cartItem.quantity)}
                      </div>
                    </div>
                    <div className="font-bold text-[#16202e] tabular-nums">
                      {formatRial(itemTotal)}
                    </div>
                  </div>

                  {/* یادداشت آیتم برای سرآشپز (FR-ORD-04) */}
                  {cartItem.note ? (
                    <div className="flex items-center justify-between text-[11px] bg-amber-50 text-[#b45309] p-1.5 rounded-lg border border-amber-200">
                      <span>یادداشت: {cartItem.note}</span>
                      <button
                        type="button"
                        onClick={() => openNoteModal(cartItem)}
                        className="text-[#e8590c] hover:underline font-bold"
                      >
                        ویرایش
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openNoteModal(cartItem)}
                      className="text-[11px] text-[#8b94a5] hover:text-[#e8590c] flex items-center gap-1 font-medium"
                    >
                      <span>📝</span>
                      <span>+ افزودن یادداشت اختصاصی (مثلا بدون پیاز)</span>
                    </button>
                  )}

                  {/* کنترل تعداد */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(cartItem.menuItem.id, -1)}
                      className="w-6 h-6 rounded bg-white border border-[#e3e7ef] text-[#dc2626] font-bold flex items-center justify-center hover:bg-red-50"
                      aria-label="کاهش"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs text-[#16202e] tabular-nums min-w-4 text-center">
                      {fa(cartItem.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCart(cartItem.menuItem)}
                      className="w-6 h-6 rounded bg-white border border-[#e3e7ef] text-[#16202e] font-bold flex items-center justify-center hover:bg-slate-100"
                      aria-label="افزایش"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* خلاصه مبالغ و ناوبری دوطرفه (رفع باگ شماره ۶) */}
        <div className="mt-4 pt-4 border-t border-[#e3e7ef] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8b94a5]">
            <span>تعداد کل اقلام:</span>
            <span className="font-bold text-[#16202e] tabular-nums">{fa(totalItemCount)} عدد</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-[#16202e]">جمع کل سفارش:</span>
            <span className="font-black text-[#e8590c] text-base tabular-nums">
              {formatRial(cartTotal)}
            </span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-[#16202e] text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              → بازگشت
            </button>
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={onNext}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                cart.length > 0
                  ? 'bg-[#e8590c] hover:bg-[#d04e0a] text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              کسر مواد و تایید سفارش ←
            </button>
          </div>
        </div>
      </div>

      {/* مودال ثبت یادداشت برای سرآشپز (FR-ORD-04) */}
      {editingNoteItemId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full border border-[#e3e7ef] shadow-xl p-5 text-right">
            <h4 className="text-sm font-bold text-[#16202e] mb-2">یادداشت آیتم برای آشپزخانه</h4>
            <p className="text-xs text-[#8b94a5] mb-3">
              این یادداشت مستقیماً در فیش آشپزخانه (KOT) سرآشپز چاپ خواهد شد.
            </p>
            <input
              type="text"
              autoFocus
              placeholder="مثال: بدون گوجه، سس تند اضافه، کاملاً برشته"
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#e3e7ef] rounded-xl mb-4 focus:outline-2 focus:outline-[#e8590c]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingNoteItemId(null)}
                className="px-3 py-1.5 text-xs text-[#8b94a5] hover:bg-slate-100 rounded-lg font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={saveNote}
                className="px-4 py-1.5 bg-[#e8590c] text-white text-xs font-bold rounded-lg hover:bg-[#d04e0a]"
              >
                ذخیره یادداشت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
