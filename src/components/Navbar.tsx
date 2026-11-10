import React, { useState } from 'react';
import { UserProfile, Role } from '../domain/types';
import { SAMPLE_USERS, getRoleTitle } from '../domain/permissions';
import { fa, formatRial } from '../domain/formatters';

interface NavbarProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  activeView: 'POS' | 'KITCHEN' | 'INVENTORY' | 'REPORTS';
  onNavigate: (view: 'POS' | 'KITCHEN' | 'INVENTORY' | 'REPORTS') => void;
  shiftCash: number;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  activeView,
  onNavigate,
  shiftCash,
  cartCount,
}) => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#e3e7ef] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element, no badges) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#e8590c] flex items-center justify-center text-white font-black text-xl shadow-xs">
              FF
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#16202e] tracking-tight whitespace-nowrap">
                فود فکتوری
              </span>
              <span className="text-xs text-[#8b94a5] hidden sm:inline whitespace-nowrap">
                سیستم جامع فروش و کنترل رسپی
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Single-line, clear active states) */}
          <nav className="flex items-center gap-2 md:gap-3 text-sm font-medium">
            <button
              onClick={() => onNavigate('POS')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeView === 'POS'
                  ? 'bg-[#fff1e6] text-[#e8590c] font-bold'
                  : 'text-[#16202e] hover:bg-slate-100'
              }`}
            >
              <span>صندوق و سفارش</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#e8590c] text-white text-xs flex items-center justify-center font-bold">
                  {fa(cartCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('KITCHEN')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'KITCHEN'
                  ? 'bg-[#e8f7ee] text-[#188a4d] font-bold'
                  : 'text-[#16202e] hover:bg-slate-100'
              }`}
            >
              <span>تیکت‌های آشپزخانه</span>
            </button>

            <button
              onClick={() => onNavigate('INVENTORY')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'INVENTORY'
                  ? 'bg-slate-100 text-[#16202e] font-bold'
                  : 'text-[#8b94a5] hover:text-[#16202e] hover:bg-slate-100'
              }`}
            >
              <span>انبار و کاردکس</span>
            </button>

            <button
              onClick={() => onNavigate('REPORTS')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'REPORTS'
                  ? 'bg-orange-50 text-[#e8590c] font-bold'
                  : 'text-[#8b94a5] hover:text-[#16202e] hover:bg-slate-100'
              }`}
            >
              <span>گزارش فروش روزانه</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action (User Role Badge & Switcher) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex flex-col text-left pl-2 text-xs border-l border-[#e3e7ef]">
              <span className="text-[#8b94a5]">موجودی کشوی نقد</span>
              <span className="font-bold text-[#16202e] tabular-nums">
                {formatRial(shiftCash)}
              </span>
            </div>

            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#f8fafc] border border-[#e3e7ef] rounded-xl hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#e8590c]"
              aria-label="تغییر نقش کاربر سیستم"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#16202e] whitespace-nowrap">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-[#8b94a5] whitespace-nowrap">
                  {getRoleTitle(currentUser.role)}
                </div>
              </div>
              <span className="text-xs text-[#8b94a5]">▼</span>
            </button>
          </div>
        </div>
      </header>

      {/* مودال انتخاب نقش کاربری جهت تست آسان ماتریس مجوز سروری */}
      {showRoleModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e3e7ef] shadow-xl p-6 text-right">
            <div className="flex items-center justify-between pb-4 border-b border-[#e3e7ef]">
              <h3 id="role-modal-title" className="text-base font-bold text-[#16202e]">
                انتخاب حساب کاربری و نقش عملیاتی
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-[#8b94a5] hover:text-[#16202e] text-lg font-bold p-1"
                aria-label="بستن پنجره"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8b94a5] mt-3 mb-4 leading-relaxed">
              جهت ارزیابی عملکرد ماتریس مجوزها در سرور، می‌توانید هویت فعال سیستم را بین نقش‌های مختلف جابجا کنید.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pl-1">
              {SAMPLE_USERS.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      setShowRoleModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-right transition-all ${
                      isSelected
                        ? 'border-[#e8590c] bg-[#fff1e6]'
                        : 'border-[#e3e7ef] hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#16202e]">{user.name}</div>
                        <div className="text-[11px] text-[#8b94a5]">{getRoleTitle(user.role)}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#e8590c]">فعال ✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-[#e3e7ef] flex justify-end">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#16202e] text-xs font-bold rounded-xl"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
