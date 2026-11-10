import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailySalesSummary, calculateStaffingInsights } from './salesReport';
import { Order } from './types';

const sampleOrders: Order[] = [
  {
    id: 'ORD-1',
    dailySequence: 1042,
    eventId: 'EVT-1',
    orderType: 'DINE_IN',
    isGuest: true,
    items: [],
    totalAmount: 1000000, // ۱٬۰۰۰٬۰۰۰ ریال با کارتخوان
    status: 'COMPLETED',
    createdAt: '2026-11-10T12:30:00.000Z',
    cashierName: 'صندوق‌دار',
    payment: {
      id: 'PAY-1',
      method: 'POS',
      amount: 1000000,
      status: 'CONFIRMED',
      timestamp: '2026-11-10T12:35:00.000Z',
    },
  },
  {
    id: 'ORD-2',
    dailySequence: 1043,
    eventId: 'EVT-2',
    orderType: 'TAKEAWAY',
    isGuest: true,
    items: [],
    totalAmount: 500000, // ۵۰۰٬۰۰۰ ریال نقدی
    status: 'COMPLETED',
    createdAt: '2026-11-10T13:15:00.000Z',
    cashierName: 'صندوق‌دار',
    payment: {
      id: 'PAY-2',
      method: 'CASH',
      amount: 500000,
      status: 'CONFIRMED',
      timestamp: '2026-11-10T13:16:00.000Z',
    },
  },
  {
    id: 'ORD-3',
    dailySequence: 1044,
    eventId: 'EVT-3',
    orderType: 'DELIVERY',
    isGuest: false,
    items: [],
    totalAmount: 2000000, // ۲٬۰۰۰٬۰۰۰ ریال ترکیبی (۱ میلیون نقد + ۱ میلیون پوز)
    status: 'CONFIRMED',
    createdAt: '2026-11-10T14:00:00.000Z',
    cashierName: 'صندوق‌دار',
    payment: {
      id: 'PAY-3',
      method: 'SPLIT',
      amount: 2000000,
      cashAmount: 1000000,
      posAmount: 1000000,
      status: 'UNKNOWN', // وضعیت نامشخص برای تست
      timestamp: '2026-11-10T14:02:00.000Z',
    },
  },
];

test('محاسبه صحیح خلاصه فروش روزانه و تفکیک روش‌های پرداخت', () => {
  const summary = calculateDailySalesSummary(sampleOrders);

  // جمع کل فروش = 1,000,000 + 500,000 + 2,000,000 = 3,500,000 ریال
  assert.equal(summary.totalSales, 3500000);
  assert.equal(summary.orderCount, 3);
  assert.equal(summary.averageTicket, Math.round(3500000 / 3));

  // تفکیک نقد و پوز
  // Cash drawer: 500,000 (order 2) + 1,000,000 (split order 3) = 1,500,000
  // POS total: 1,000,000 (order 1) + 1,000,000 (split order 3) = 2,000,000
  assert.equal(summary.cashDrawerBalance, 1500000);
  assert.equal(summary.posTotalBalance, 2000000);

  // بررسی آرایه تفکیک روش‌ها
  const posMethod = summary.methods.find((m) => m.method === 'POS');
  assert.equal(posMethod?.amount, 1000000);
  assert.equal(posMethod?.count, 1);

  const cashMethod = summary.methods.find((m) => m.method === 'CASH');
  assert.equal(cashMethod?.amount, 500000);
  assert.equal(cashMethod?.count, 1);

  const splitMethod = summary.methods.find((m) => m.method === 'SPLIT');
  assert.equal(splitMethod?.amount, 2000000);
  assert.equal(splitMethod?.count, 1);

  // وضعیت نامشخص (Unknown)
  const unknownStatus = summary.statuses.find((s) => s.status === 'UNKNOWN');
  assert.equal(unknownStatus?.count, 1);
  assert.equal(unknownStatus?.amount, 2000000);
});

test('محاسبه صحیح میانگین فروش ساعتی و توصیه‌های تخصیص پرسنل (Staff Scheduling)', () => {
  const staffingReport = calculateStaffingInsights(sampleOrders);

  assert.ok(staffingReport.hourlyInsights.length >= 12);
  assert.ok(staffingReport.peakHour);
  assert.ok(staffingReport.calmestHour);
  assert.ok(staffingReport.totalShiftRoster.lunchShift);
  assert.ok(staffingReport.totalShiftRoster.dinnerShift);

  // در اوج شلوغی باید حداقل ۲ صندوق‌دار یا پرسنل بیشتر توصیه شود
  assert.ok(staffingReport.peakHour.recommendedKitchenStaff >= 2);
  assert.ok(staffingReport.peakHour.staffingSummary.length > 0);
  assert.ok(staffingReport.peakHour.operationalAdvice.length > 0);
});
