/**
 * توابع تبدیل اعداد و تاریخ به فرمت فارسی استاندارد
 * بدون وابستگی بیرونی، سازگار با محیط آفلاین و دستگاه‌های کم‌مصرف
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * تبدیل ارقام انگلیسی به فارسی
 */
export function fa(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  return str.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
}

/**
 * جداسازی ۳ رقمی ارقام با علامت «٬» فارسی و تبدیل به ارقام فارسی
 * مثال: 1250000 -> ۱٬۲۵۰٬۰۰۰
 */
export function nf(val: number | string | undefined | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '۰';
  const num = Math.floor(Math.abs(Number(val)));
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  const persian = formatted.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
  return Number(val) < 0 ? `-${persian}` : persian;
}

/**
 * قالب‌بندی مبلغ به ریال
 * مثال: ۱٬۴۵۰٬۰۰۰ ریال
 */
export function formatRial(amount: number): string {
  return `${nf(amount)} ریال`;
}

/**
 * قالب‌بندی زمان به صورت ساعت:دقیقه فارسی
 */
export function formatTime(isoString?: string): string {
  const d = isoString ? new Date(isoString) : new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${fa(hours)}:${fa(minutes)}`;
}

/**
 * قالب‌بندی تاریخ و ساعت کامل
 */
export function formatDateTime(isoString?: string): string {
  const d = isoString ? new Date(isoString) : new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // استفاده از فرمت تاریخ شمسی توکار جاوااسکریپت در صورت در دسترس بودن
  let datePart = '';
  try {
    datePart = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    datePart = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  return `${fa(datePart)} - ${fa(hours)}:${fa(minutes)}:${fa(seconds)}`;
}

/**
 * قالب‌بندی مقدار ماده اولیه به همراه واحد
 */
export function formatMaterialAmount(amount: number, unit: string): string {
  return `${nf(amount)} ${unit}`;
}
