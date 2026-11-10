import { Role, UserProfile } from './types';

export type Permission =
  | 'CREATE_ORDER'             // ثبت سفارش
  | 'CONFIRM_RECIPE_DEDUCTION' // تایید انفجار رسپی و کسر اتمی موجودی (Δ-01)
  | 'PROCESS_PAYMENT'          // دریافت وجه و نهایی‌سازی پرداخت
  | 'CANCEL_ORDER'             // لغو سفارش و برگشت موجودی
  | 'VIEW_KITCHEN_QUEUE'       // مشاهده تیکت‌های آشپزخانه
  | 'UPDATE_PREPARATION'       // تغییر وضعیت پخت (در حال آماده‌سازی/آماده تحویل)
  | 'VIEW_INVENTORY_LEDGER'    // مشاهده کاردکس و موجودی انبار
  | 'ADJUST_INVENTORY'         // تعدیل موجودی و ثبت ورود کالا
  | 'CLOSE_SHIFT';             // بستن شیفت و تحویل نقدینگی

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CASHIER: [
    'CREATE_ORDER',
    'CONFIRM_RECIPE_DEDUCTION',
    'PROCESS_PAYMENT',
    'VIEW_KITCHEN_QUEUE',
    'VIEW_INVENTORY_LEDGER',
  ],
  KITCHEN: [
    'VIEW_KITCHEN_QUEUE',
    'UPDATE_PREPARATION',
    'VIEW_INVENTORY_LEDGER',
  ],
  WAREHOUSE: [
    'VIEW_INVENTORY_LEDGER',
    'ADJUST_INVENTORY',
  ],
  SHIFT_SUPER: [
    'CREATE_ORDER',
    'CONFIRM_RECIPE_DEDUCTION',
    'PROCESS_PAYMENT',
    'CANCEL_ORDER',
    'VIEW_KITCHEN_QUEUE',
    'UPDATE_PREPARATION',
    'VIEW_INVENTORY_LEDGER',
    'CLOSE_SHIFT',
  ],
  ACCOUNTANT: [
    'VIEW_INVENTORY_LEDGER',
    'CLOSE_SHIFT',
  ],
  DELIVERY: [
    'VIEW_KITCHEN_QUEUE',
  ],
  MANAGER: [
    'CREATE_ORDER',
    'CONFIRM_RECIPE_DEDUCTION',
    'PROCESS_PAYMENT',
    'CANCEL_ORDER',
    'VIEW_KITCHEN_QUEUE',
    'UPDATE_PREPARATION',
    'VIEW_INVENTORY_LEDGER',
    'ADJUST_INVENTORY',
    'CLOSE_SHIFT',
  ],
};

export const SAMPLE_USERS: UserProfile[] = [
  { id: 'USR-1', name: 'سروش قاسمی (صندوق‌دار)', role: 'CASHIER', avatarColor: '#e8590c' },
  { id: 'USR-2', name: 'استاد مرادی (سرآشپز)', role: 'KITCHEN', avatarColor: '#188a4d' },
  { id: 'USR-3', name: 'رضا کمالی (انباردار)', role: 'WAREHOUSE', avatarColor: '#4f46e5' },
  { id: 'USR-4', name: 'حسین اکبری (مدیر رستوران)', role: 'MANAGER', avatarColor: '#b45309' },
  { id: 'USR-5', name: 'فرزاد نوری (سرپرست شیفت)', role: 'SHIFT_SUPER', avatarColor: '#0891b2' },
  { id: 'USR-6', name: 'ندا شمس (حسابدار)', role: 'ACCOUNTANT', avatarColor: '#9333ea' },
  { id: 'USR-7', name: 'میثم طاهری (پیک موتوری)', role: 'DELIVERY', avatarColor: '#64748b' },
];

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

export function getRoleTitle(role: Role): string {
  const titles: Record<Role, string> = {
    CASHIER: 'صندوق‌دار',
    KITCHEN: 'سرآشپز / آشپزخانه',
    WAREHOUSE: 'انباردار',
    SHIFT_SUPER: 'سرپرست شیفت',
    ACCOUNTANT: 'امور مالی و حسابداری',
    DELIVERY: 'پیک و تحویل',
    MANAGER: 'مدیر کل شعبه',
  };
  return titles[role] || role;
}
