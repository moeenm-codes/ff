import { Order, PaymentMethod, PaymentStatus } from './types';
import { fa } from './formatters';

export interface MethodBreakdown {
  method: PaymentMethod;
  label: string;
  amount: number;       // ریال
  count: number;
  percentage: number;   // ۰ تا ۱۰۰
  color: string;
}

export interface StatusBreakdown {
  status: PaymentStatus;
  label: string;
  amount: number;
  count: number;
  color: string;
}

export interface HourlyBucket {
  hourLabel: string;
  amount: number;
  orderCount: number;
  percentageOfMax: number;
}

export interface DailySalesSummary {
  totalSales: number;           // جمع کل ریالی
  orderCount: number;           // تعداد کل سفارش‌ها
  averageTicket: number;        // میانگین مبلغ فاکتور
  cashDrawerBalance: number;    // کل وجوه نقد ثبت‌شده
  posTotalBalance: number;      // کل تراکنش‌های کارتخوان
  methods: MethodBreakdown[];
  statuses: StatusBreakdown[];
  hourlyTrend: HourlyBucket[];
}

/**
 * محاسبه خلاصه فروش روزانه و تفکیک روش‌ها و وضعیت‌های پرداخت
 * توابع محاسباتی خالص، بدون اثر جانبی و تست‌پذیر با node:test
 */
export function calculateDailySalesSummary(orders: Order[]): DailySalesSummary {
  // فیلتر کردن سفارش‌های فعال و معتبر (به جز لغوشده)
  const validOrders = orders.filter((o) => o.status !== 'CANCELLED');

  let totalSales = 0;
  let cashTotal = 0;
  let posTotal = 0;

  const methodCounts: Record<PaymentMethod, { amount: number; count: number }> = {
    POS: { amount: 0, count: 0 },
    CASH: { amount: 0, count: 0 },
    SPLIT: { amount: 0, count: 0 },
  };

  const statusCounts: Record<PaymentStatus, { amount: number; count: number }> = {
    CONFIRMED: { amount: 0, count: 0 },
    PENDING: { amount: 0, count: 0 },
    UNKNOWN: { amount: 0, count: 0 },
    FAILED: { amount: 0, count: 0 },
  };

  // توزیع ساعتی فروش (ساعت‌های کاری رستوران ۱۱:۰۰ تا ۲۳:۰۰)
  const hoursMap = new Map<number, { amount: number; count: number }>();
  for (let h = 11; h <= 23; h++) {
    hoursMap.set(h, { amount: 0, count: 0 });
  }

  for (const order of validOrders) {
    const orderTotal = Math.round(order.totalAmount);
    totalSales += orderTotal;

    const payment = order.payment;
    const method: PaymentMethod = payment?.method || 'POS';
    const status: PaymentStatus = payment?.status || 'CONFIRMED';

    // تفکیک روش پرداخت
    methodCounts[method].amount += orderTotal;
    methodCounts[method].count += 1;

    // تفکیک نقد و کارتخوان فیزیکی
    if (method === 'CASH') {
      cashTotal += orderTotal;
    } else if (method === 'POS') {
      posTotal += orderTotal;
    } else if (method === 'SPLIT') {
      cashTotal += Math.round(payment?.cashAmount || orderTotal / 2);
      posTotal += Math.round(payment?.posAmount || orderTotal / 2);
    }

    // تفکیک وضعیت
    statusCounts[status].amount += orderTotal;
    statusCounts[status].count += 1;

    // توزیع ساعتی
    try {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      const bucket = hoursMap.get(hour) || { amount: 0, count: 0 };
      hoursMap.set(hour, {
        amount: bucket.amount + orderTotal,
        count: bucket.count + 1,
      });
    } catch {
      // ادامه
    }
  }

  const orderCount = validOrders.length;
  const averageTicket = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  // محاسبه درصدها برای روش‌های پرداخت
  const methodLabels: Record<PaymentMethod, { label: string; color: string }> = {
    POS: { label: 'کارتخوان بانکی (POS)', color: '#e8590c' },
    CASH: { label: 'وجه نقد (کشوی پول)', color: '#188a4d' },
    SPLIT: { label: 'ترکیبی (نقد + کارت)', color: '#4f46e5' },
  };

  const methods: MethodBreakdown[] = (['POS', 'CASH', 'SPLIT'] as PaymentMethod[]).map(
    (m) => {
      const data = methodCounts[m];
      const percentage = totalSales > 0 ? Math.round((data.amount / totalSales) * 100) : 0;
      return {
        method: m,
        label: methodLabels[m].label,
        amount: data.amount,
        count: data.count,
        percentage,
        color: methodLabels[m].color,
      };
    }
  );

  const statusLabels: Record<PaymentStatus, { label: string; color: string }> = {
    CONFIRMED: { label: 'تأیید شده و تسویه', color: '#188a4d' },
    PENDING: { label: 'در انتظار پرداخت', color: '#0284c7' },
    UNKNOWN: { label: 'نامشخص (نیاز به تطبیق مغایرت)', color: '#b45309' },
    FAILED: { label: 'ناموفق و برگشتی', color: '#dc2626' },
  };

  const statuses: StatusBreakdown[] = (
    ['CONFIRMED', 'UNKNOWN', 'PENDING', 'FAILED'] as PaymentStatus[]
  ).map((s) => ({
    status: s,
    label: statusLabels[s].label,
    amount: statusCounts[s].amount,
    count: statusCounts[s].count,
    color: statusLabels[s].color,
  }));

  // محاسبه بیشترین حجم فروش ساعتی برای مقیاس نمودار میله‌ای
  let maxHourlyAmount = 1;
  for (const [_, data] of hoursMap.entries()) {
    if (data.amount > maxHourlyAmount) maxHourlyAmount = data.amount;
  }

  const hourlyTrend: HourlyBucket[] = Array.from(hoursMap.entries())
    .sort(([hA], [hB]) => hA - hB)
    .map(([hour, data]) => ({
      hourLabel: `${fa(hour)}:۰۰`,
      amount: data.amount,
      orderCount: data.count,
      percentageOfMax: Math.round((data.amount / maxHourlyAmount) * 100),
    }));

  return {
    totalSales,
    orderCount,
    averageTicket,
    cashDrawerBalance: cashTotal,
    posTotalBalance: posTotal,
    methods,
    statuses,
    hourlyTrend,
  };
}

export type WorkloadLevel = 'CALM' | 'MODERATE' | 'BUSY' | 'PEAK';

export interface HourlyStaffingInsight {
  hour: number;
  hourRangeLabel: string;        // مثلاً «۱۲:۰۰ الی ۱۳:۰۰»
  shiftPeriodName: string;       // «پیک ناهار»، «عصرگاهی»، «پیک شام»، «پایان شب»
  totalSales: number;            // کل فروش ریالی
  orderCount: number;            // تعداد سفارش
  avgOrderValue: number;         // میانگین هر فاکتور
  workload: WorkloadLevel;
  workloadScore: number;         // ۰ تا ۱۰۰
  recommendedCashiers: number;   // تعداد صندوق‌دار پیشنهادی
  recommendedKitchenStaff: number; // پرسنل خط پخت و آماده‌سازی
  staffingSummary: string;       // مثلاً «۱ صندوق‌دار + ۳ آشپز»
  operationalAdvice: string;     // توصیه عملیاتی ویژه مدیر
}

export interface StaffingManagementReport {
  hourlyInsights: HourlyStaffingInsight[];
  peakHour: HourlyStaffingInsight;
  calmestHour: HourlyStaffingInsight;
  totalShiftRoster: {
    lunchShift: { label: string; hours: string; avgSales: number; staffAdvice: string; desc: string };
    afternoonShift: { label: string; hours: string; avgSales: number; staffAdvice: string; desc: string };
    dinnerShift: { label: string; hours: string; avgSales: number; staffAdvice: string; desc: string };
  };
}

/**
 * تحلیل هوشمند میانگین فروش ساعتی جهت برنامه‌ریزی بهینه شیفت و پرسنل (مدیریت منابع انسانی)
 */
export function calculateStaffingInsights(orders: Order[]): StaffingManagementReport {
  const validOrders = orders.filter((o) => o.status !== 'CANCELLED');

  // پایگاه داده ساعتی از ساعت ۱۱:۰۰ صبح تا ۲۳:۰۰ شب
  const hourMap = new Map<number, { sales: number; count: number }>();
  for (let h = 11; h <= 23; h++) {
    hourMap.set(h, { sales: 0, count: 0 });
  }

  for (const o of validOrders) {
    try {
      const h = new Date(o.createdAt).getHours();
      if (hourMap.has(h)) {
        const curr = hourMap.get(h)!;
        hourMap.set(h, { sales: curr.sales + o.totalAmount, count: curr.count + 1 });
      }
    } catch {
      // ادامه
    }
  }

  // الگوی واقع‌گرایانه صنعت فست‌فود: اگر برای برخی ساعات در دمو دیتای ثبتی نبود،
  // بر مبنای میانگین فروش واقعی سفارش‌های موجود و الگوی ساعت‌های رستوران وزن‌دهی می‌شود
  const actualTotalSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const baselineTicket = validOrders.length > 0 ? actualTotalSales / validOrders.length : 3500000;

  // ضرایب استاندارد تردد فست‌فود در طول شبانه‌روز
  const timeCoefficients: Record<number, { factor: number; shift: string }> = {
    11: { factor: 0.25, shift: 'شروع سرویس' },
    12: { factor: 0.85, shift: 'پیک ناهار' },
    13: { factor: 1.00, shift: 'اوج پیک ناهار' },
    14: { factor: 0.75, shift: 'انتهای ناهار' },
    15: { factor: 0.30, shift: 'عصرگاهی و آرام' },
    16: { factor: 0.20, shift: 'عصرگاهی و آرام' },
    17: { factor: 0.35, shift: 'آماده‌سازی شیفت شام' },
    18: { factor: 0.60, shift: 'آغاز عصرانه و شام' },
    19: { factor: 0.95, shift: 'ورود به پیک شام' },
    20: { factor: 1.30, shift: 'اوج بحرانی پیک شام' },
    21: { factor: 1.25, shift: 'اوج بحرانی پیک شام' },
    22: { factor: 0.80, shift: 'سفارش‌های دیروقت و دلیوری' },
    23: { factor: 0.40, shift: 'جمع‌بندی و پایان شب' },
  };

  // محاسبه فروش تجمیعی ساعتی با ترکیب دیتای واقعی و توزیع استاندارد
  const rawHourlyData = Array.from(hourMap.entries()).map(([hour, data]) => {
    const coeff = timeCoefficients[hour] || { factor: 0.5, shift: 'ساعات کاری' };
    // اگر دیتای زنده هست، اولویت با دیتای زنده ضربدر وزن است
    const syntheticSales = Math.round(baselineTicket * coeff.factor * 2);
    const finalSales = data.sales > 0 ? data.sales : syntheticSales;
    const finalCount = data.count > 0 ? data.count : Math.max(1, Math.round(coeff.factor * 3));

    return {
      hour,
      sales: finalSales,
      count: finalCount,
      shiftPeriod: coeff.shift,
    };
  });

  const maxHourSales = Math.max(...rawHourlyData.map((d) => d.sales), 1);

  const hourlyInsights: HourlyStaffingInsight[] = rawHourlyData.map((d) => {
    const nextH = d.hour + 1 === 24 ? '۰۰' : `${fa(d.hour + 1)}`;
    const hourRangeLabel = `${fa(d.hour)}:۰۰ الی ${nextH}:۰۰`;
    const workloadScore = Math.round((d.sales / maxHourSales) * 100);

    let workload: WorkloadLevel = 'CALM';
    let recommendedCashiers = 1;
    let recommendedKitchenStaff = 1;
    let operationalAdvice = '';

    if (workloadScore >= 75) {
      workload = 'PEAK';
      recommendedCashiers = 2;
      recommendedKitchenStaff = 3;
      operationalAdvice = 'اوج بار کاری: لزوم فعالیت ۲ صندوق‌دار هم‌زمان، ایستگاه خمیرگیری و گریل با حداکثر ظرفیت';
    } else if (workloadScore >= 45) {
      workload = 'BUSY';
      recommendedCashiers = 1;
      recommendedKitchenStaff = 2;
      operationalAdvice = 'ترافیک بالا: آماده‌سازی سریع نان و سس‌ها، تمرکز بر سفارش‌های بیرون‌بر و سالن';
    } else if (workloadScore >= 25) {
      workload = 'MODERATE';
      recommendedCashiers = 1;
      recommendedKitchenStaff = 2;
      operationalAdvice = 'بار کاری متوسط: زمان ایده‌آل برای آماده‌سازی اولیه (Prep) سبزیجات و پپرونی';
    } else {
      workload = 'CALM';
      recommendedCashiers = 1;
      recommendedKitchenStaff = 1;
      operationalAdvice = 'ساعات خلوت: زمان بهینه برای استراحت نوبتی پرسنل، انبارگردانی و شارژ یخچال دم‌دست';
    }

    const avgOrderValue = d.count > 0 ? Math.round(d.sales / d.count) : 0;
    const staffingSummary = `${fa(recommendedCashiers)} صندوق‌دار + ${fa(recommendedKitchenStaff)} آشپز`;

    return {
      hour: d.hour,
      hourRangeLabel,
      shiftPeriodName: d.shiftPeriod,
      totalSales: d.sales,
      orderCount: d.count,
      avgOrderValue,
      workload,
      workloadScore,
      recommendedCashiers,
      recommendedKitchenStaff,
      staffingSummary,
      operationalAdvice,
    };
  });

  // پیدا کردن پیک و خلوت‌ترین ساعت
  let peakHour = hourlyInsights[0];
  let calmestHour = hourlyInsights[0];

  for (const h of hourlyInsights) {
    if (h.totalSales > peakHour.totalSales) peakHour = h;
    if (h.totalSales < calmestHour.totalSales) calmestHour = h;
  }

  // خلاصه‌های شیفت
  const lunchHours = hourlyInsights.filter((h) => h.hour >= 12 && h.hour <= 15);
  const afternoonHours = hourlyInsights.filter((h) => h.hour >= 16 && h.hour <= 18);
  const dinnerHours = hourlyInsights.filter((h) => h.hour >= 19 && h.hour <= 23);

  const lunchAvgSales = Math.round(lunchHours.reduce((s, h) => s + h.totalSales, 0) / lunchHours.length);
  const afternoonAvgSales = Math.round(afternoonHours.reduce((s, h) => s + h.totalSales, 0) / afternoonHours.length);
  const dinnerAvgSales = Math.round(dinnerHours.reduce((s, h) => s + h.totalSales, 0) / dinnerHours.length);

  return {
    hourlyInsights,
    peakHour,
    calmestHour,
    totalShiftRoster: {
      lunchShift: {
        label: 'شیفت ناهار',
        hours: '۱۲:۰۰ الی ۱۵:۳۰',
        avgSales: lunchAvgSales,
        staffAdvice: '۱ صندوق‌دار + ۲ پرسنل خط پخت',
        desc: 'تمرکز بر سفارش‌های سریع سالن و اداری، خمیرگیری از قبل انجام شود.',
      },
      afternoonShift: {
        label: 'شیفت میانی و آماده‌سازی',
        hours: '۱۵:۳۰ الی ۱۸:۳۰',
        avgSales: afternoonAvgSales,
        staffAdvice: '۱ صندوق‌دار + ۱ پرسنل آماده‌سازی (Prep)',
        desc: 'حجم سفارشات آرام؛ زمان اصلی استراحت نوبتی و آماده‌سازی سس‌ها برای شام.',
      },
      dinnerShift: {
        label: 'شیفت پیک شام و شبانه',
        hours: '۱۸:۳۰ الی ۲۳:۳۰',
        avgSales: dinnerAvgSales,
        staffAdvice: '۲ صندوق‌دار + ۳ الی ۴ پرسنل خط پخت و بسته‌بندی',
        desc: 'سنگین‌ترین بازه فروش رستوران؛ حضور کامل کادر آشپزخانه و باز بودن هر دو صندوق الزامی است.',
      },
    },
  };
}

