import { CartItem } from './types';

/**
 * محاسبه جمع کل سبد خرید بر حسب ریال
 * تضمین عدد صحیح بودن (Integer) و عدم وجود اعشار شناور
 */
export function calculateCartTotal(cart: CartItem[]): number {
  let total = 0;
  for (const item of cart) {
    total += Math.round(item.unitPrice) * item.quantity;
  }
  return total;
}

/**
 * محاسبه دکمه‌های میان‌بر مبلغ نقدی دریافتی (رفع باگ شماره ۸ پروتوتایپ)
 * مبالغ باید یکتا باشند، از مبلغ سفارش بزرگ‌تر یا مساوی باشند و بدون تکرار باشند.
 *
 * @param totalAmount مبلغ کل سفارش به ریال
 */
export function generateQuickCashPresets(totalAmount: number): number[] {
  if (totalAmount <= 0) return [];

  // مقادیر استاندارد اسکناس و ایران‌چک رایج
  const standardDenominations = [
    500000,    // ۵۰۰٬۰۰۰ ریال (۵۰ هزار تومان)
    1000000,   // ۱٬۰۰۰٬۰۰۰ ریال (۱۰۰ هزار تومان)
    2000000,   // ۲٬۰۰۰٬۰۰۰ ریال (۲۰۰ هزار تومان)
    5000000,   // ۵٬۰۰۰٬۰۰۰ ریال (۵۰۰ هزار تومان)
    10000000,  // ۱۰٬۰۰۰٬۰۰۰ ریال (۱ میلیون تومان)
  ];

  // مبلغ دقیق سفارش همیشه اولین گزینه است
  const presets = new Set<number>();
  presets.add(totalAmount);

  // گرد کردن به نزدیک‌ترین ۵۰۰ هزار ریال بالاتر
  const nextHalfMillion = Math.ceil(totalAmount / 500000) * 500000;
  if (nextHalfMillion > totalAmount) {
    presets.add(nextHalfMillion);
  }

  // اضافه کردن ارقام استاندارد بالاتر از مبلغ کل
  for (const denom of standardDenominations) {
    if (denom > totalAmount) {
      presets.add(denom);
    }
  }

  // تبدیل به آرایه، مرتب‌سازی صعودی و حداکثر ۵ گزینه متمایز
  return Array.from(presets)
    .sort((a, b) => a - b)
    .slice(0, 5);
}

/**
 * محاسبه باقیمانده بازپرداختی به مشتری (وجه برگشتی)
 */
export function calculateChangeAmount(tenderedCash: number, totalDue: number): number {
  return Math.max(0, tenderedCash - totalDue);
}
