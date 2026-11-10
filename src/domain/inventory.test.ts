import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAvailableToAdd,
  calculateTotalMaterialConsumption,
  explodeRecipeForOrder,
  deductMaterialsAtomically,
} from './inventory';
import { generateQuickCashPresets, calculateCartTotal } from './pricing';
import { fa, nf } from './formatters';
import { RawMaterial, MenuItem, CartItem } from './types';

// مواد اولیه آزمایشی
const testMaterials: RawMaterial[] = [
  { id: 'MAT-DOUGH', code: 'RM-01', name: 'خمیر پیتزا', unit: 'گرم', stock: 1000, minThreshold: 200, costPerUnit: 100, location: 'PREP' },
  { id: 'MAT-CHEESE', code: 'RM-02', name: 'پنیر پیتزا', unit: 'گرم', stock: 500, minThreshold: 100, costPerUnit: 200, location: 'KITCHEN_STOCK' },
];

// آیتم‌های آزمایشی دارای ماده مشترک (خمیر)
const itemPizzaA: MenuItem = {
  id: 'ITEM-A',
  code: 'PZ-A',
  name: 'پیتزا مخصوص',
  categoryId: 'CAT-1',
  price: 2000000,
  description: 'تست',
  imageEmoji: '🍕',
  recipe: [
    { materialId: 'MAT-DOUGH', amount: 250 },
    { materialId: 'MAT-CHEESE', amount: 100 },
  ],
};

const itemPizzaB: MenuItem = {
  id: 'ITEM-B',
  code: 'PZ-B',
  name: 'پیتزا سبزیجات',
  categoryId: 'CAT-1',
  price: 1800000,
  description: 'تست',
  imageEmoji: '🥦',
  recipe: [
    { materialId: 'MAT-DOUGH', amount: 200 },
  ],
};

test('حل باگ شماره ۱: مصرف مواد اولیه مشترک در سبد خرید محاسبه می‌شود', () => {
  // اگر سبد خالی باشد، از پیتزا A حداکثر ۴ عدد با ۱۰۰۰ گرم خمیر قابل سفارش است
  const emptyCart: CartItem[] = [];
  const maxA = calculateAvailableToAdd(itemPizzaA, testMaterials, emptyCart);
  assert.equal(maxA, 4); // 1000 / 250 = 4, 500 / 100 = 5 -> min = 4

  // اکنون ۲ عدد پیتزا A در سبد قرار دارد (۵۰۰ گرم خمیر و ۲۰۰ گرم پنیر مصرف شده)
  const cartWithA: CartItem[] = [
    { id: 'C-1', menuItem: itemPizzaA, quantity: 2, unitPrice: 2000000 },
  ];

  // موجودی باقیمانده خمیر: 500 گرم. پیتزا B هر عدد ۲۰۰ گرم خمیر می‌خواهد.
  // بنابراین از پیتزا B فقط ۲ عدد (400 گرم) می‌توان سفارش داد نه ۵ عدد!
  const availableB = calculateAvailableToAdd(itemPizzaB, testMaterials, cartWithA);
  assert.equal(availableB, 2); // floor(500 / 200) = 2
});

test('تراکنش انفجار رسپی و هشدارهای کسری موجودی', () => {
  const cart: CartItem[] = [
    { id: 'C-1', menuItem: itemPizzaA, quantity: 5, unitPrice: 2000000 }, // نیازمند ۱۲۵۰ خمیر در حالی که فقط ۱۰۰۰ هست
  ];

  const result = explodeRecipeForOrder(cart, testMaterials);
  assert.equal(result.hasDeficit, true);
  const doughRow = result.rows.find((r) => r.materialId === 'MAT-DOUGH');
  assert.ok(doughRow);
  assert.equal(doughRow?.required, 1250);
  assert.equal(doughRow?.afterStock, -250);
  assert.equal(doughRow?.status, 'DEFICIT');
});

test('کسر اتمی مواد اولیه و ثبت در کاردکس غیرقابل ویرایش (قاعده Δ-01)', () => {
  const cart: CartItem[] = [
    { id: 'C-1', menuItem: itemPizzaA, quantity: 2, unitPrice: 2000000 },
  ];

  const { updatedMaterials, ledgerEntries } = deductMaterialsAtomically(
    cart,
    testMaterials,
    1042,
    'سروش قاسمی'
  );

  const updatedDough = updatedMaterials.find((m) => m.id === 'MAT-DOUGH');
  assert.equal(updatedDough?.stock, 500); // 1000 - 500 = 500

  assert.equal(ledgerEntries.length, 2);
  assert.equal(ledgerEntries[0].changeAmount, -500);
  assert.equal(ledgerEntries[0].balanceAfter, 500);
  assert.equal(ledgerEntries[0].referenceId, 'سفارش #1042');
});

test('حل باگ شماره ۸: دکمه‌های میان‌بر نقدی بدون ارقام تکراری تولید می‌شوند', () => {
  // اگر مبلغ سفارش ۱٬۰۰۰٬۰۰۰ ریال باشد، نباید رقم ۱٬۰۰۰٬۰۰۰ دو بار تکرار شود
  const total = 1000000;
  const presets = generateQuickCashPresets(total);

  // بررسی عدم تکراری بودن مقادیر
  const uniquePresets = Array.from(new Set(presets));
  assert.equal(presets.length, uniquePresets.length);

  // تمام مقادیر باید بزرگ‌تر یا مساوی مبلغ سفارش باشند
  for (const p of presets) {
    assert.ok(p >= total);
  }
});

test('فرمت‌کننده‌های فارسی اعداد و جداکننده هزارگان', () => {
  assert.equal(fa(1042), '۱۰۴۲');
  assert.equal(fa('0912'), '۰۹۱۲');
  assert.equal(nf(1450000), '۱٬۴۵۰٬۰۰۰');
  assert.equal(nf(0), '۰');
});
