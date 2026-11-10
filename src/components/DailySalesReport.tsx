import React, { useState, useMemo } from 'react';
import { Order, PaymentMethod, UserProfile } from '../domain/types';
import { calculateDailySalesSummary, calculateStaffingInsights } from '../domain/salesReport';
import { fa, formatDateTime, formatRial, formatTime } from '../domain/formatters';

interface DailySalesReportProps {
  orders: Order[];
  currentUser: UserProfile;
}

export const DailySalesReport: React.FC<DailySalesReportProps> = ({
  orders,
  currentUser,
}) => {
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  // محاسبه شاخص‌ها و خلاصه‌ها
  const summary = useMemo(() => calculateDailySalesSummary(orders), [orders]);

  // تحلیل هوشمند میانگین فروش ساعتی جهت مدیریت پرسنل و چیدمان شیفت
  const staffingReport = useMemo(() => calculateStaffingInsights(orders), [orders]);

  // فیلتر سفارش‌ها
  const filteredOrders = useMemo(() => {
    if (selectedMethodFilter === 'ALL') return orders;
    return orders.filter((o) => (o.payment?.method || 'POS') === selectedMethodFilter);
  }, [orders, selectedMethodFilter]);

  const handlePrint = () => {
    window.print();
  };

  // پیدا کردن بیشترین مبلغ در روش‌ها جهت تنظیم مقیاس نمودار
  const maxMethodAmount = Math.max(...summary.methods.map((m) => m.amount), 1);

  return (
    <div className="space-y-6">
      {/* سربرگ گزارش */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#e8590c]">پنل مدیریت و هوش مالی رستوران</div>
          <h2 className="text-xl font-black text-[#16202e] flex items-center gap-2 mt-0.5">
            <span>گزارش خلاصه فروش روزانه و تسویه‌حساب (Sales Report)</span>
          </h2>
          <p className="text-xs text-[#8b94a5] mt-1">
            تحلیل جامع درآمدهای روز جاری به تفکیک روش‌های پرداخت بانکی، نقدی و پیگیری مغایرت‌ها
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#16202e] text-xs font-bold rounded-xl flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#e8590c]"
          >
            <span>🖨️</span>
            <span>چاپ گزارش مالی روز</span>
          </button>
        </div>
      </div>

      {/* کارتهای KPI شاخص‌های کلیدی فروش روزانه */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#8b94a5] mb-1">
            <span>کل فروش ناخالص امروز</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-xl font-black text-[#16202e] tabular-nums">
            {formatRial(summary.totalSales)}
          </div>
          <div className="text-[11px] text-[#8b94a5] mt-1">
            از مجموع <span className="font-bold text-[#16202e]">{fa(summary.orderCount)}</span> فاکتور ثبت‌شده
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#8b94a5] mb-1">
            <span>دریافتی کارتخوان (POS)</span>
            <span className="text-lg">💳</span>
          </div>
          <div className="text-xl font-black text-[#e8590c] tabular-nums">
            {formatRial(summary.posTotalBalance)}
          </div>
          <div className="text-[11px] text-[#8b94a5] mt-1">
            سهم از کل: <span className="font-bold text-[#e8590c]">
              {summary.totalSales > 0 ? fa(Math.round((summary.posTotalBalance / summary.totalSales) * 100)) : '۰'}٪
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#8b94a5] mb-1">
            <span>وجوه نقد ورودی کشو</span>
            <span className="text-lg">💵</span>
          </div>
          <div className="text-xl font-black text-[#188a4d] tabular-nums">
            {formatRial(summary.cashDrawerBalance)}
          </div>
          <div className="text-[11px] text-[#8b94a5] mt-1">
            سهم از کل: <span className="font-bold text-[#188a4d]">
              {summary.totalSales > 0 ? fa(Math.round((summary.cashDrawerBalance / summary.totalSales) * 100)) : '۰'}٪
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#8b94a5] mb-1">
            <span>میانگین هر سفارش (AOV)</span>
            <span className="text-lg">📊</span>
          </div>
          <div className="text-xl font-black text-[#4f46e5] tabular-nums">
            {formatRial(summary.averageTicket)}
          </div>
          <div className="text-[11px] text-[#8b94a5] mt-1">
            ارزش میانگین سبد مشتریان
          </div>
        </div>
      </div>

      {/* بخش اصلی: نمودار میله‌ای تفکیک مبالغ دریافتی بر اساس روش پرداخت */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* نمودار میله‌ای افقی تفکیک روش پرداخت (۷ ستون در دسکتاپ) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#e3e7ef]">
            <div>
              <h3 className="text-base font-bold text-[#16202e]">
                نمودار میله‌ای مجموع مبالغ به تفکیک روش پرداخت
              </h3>
              <span className="text-xs text-[#8b94a5]">
                مقایسه حجم ریالی تراکنش‌های کارتخوان، وجه نقد و پرداخت ترکیبی
              </span>
            </div>
            <span className="text-xs font-bold text-[#8b94a5]">مجموع ۱۰۰٪</span>
          </div>

          {/* میله‌های نمودار تفکیک روش پرداخت */}
          <div className="space-y-6">
            {summary.methods.map((methodItem) => {
              // محاسبه عرض میله نسبت به بیشترین روش برای مقیاس دیداری
              const barWidthPercent = summary.totalSales > 0
                ? Math.max(4, Math.round((methodItem.amount / maxMethodAmount) * 100))
                : 0;

              return (
                <div key={methodItem.method} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-md shrink-0"
                        style={{ backgroundColor: methodItem.color }}
                      />
                      <span className="text-[#16202e]">{methodItem.label}</span>
                      <span className="text-[#8b94a5] font-normal">
                        ({fa(methodItem.count)} تراکنش)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[#8b94a5] tabular-nums font-normal">
                        {fa(methodItem.percentage)}٪
                      </span>
                      <span className="text-[#16202e] font-black tabular-nums">
                        {formatRial(methodItem.amount)}
                      </span>
                    </div>
                  </div>

                  {/* نوار میله‌ای پس‌زمینه و پرکننده */}
                  <div className="w-full h-5 bg-slate-100 rounded-lg overflow-hidden flex items-center p-0.5">
                    <div
                      className="h-full rounded-md transition-all duration-500 ease-out flex items-center justify-end px-2"
                      style={{
                        width: `${barWidthPercent}%`,
                        backgroundColor: methodItem.color,
                      }}
                    >
                      {barWidthPercent > 18 && (
                        <span className="text-[10px] font-bold text-white tabular-nums">
                          {fa(methodItem.percentage)}٪
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* نوار تجمیعی تک‌خطی (Stacked Bar) */}
          <div className="pt-4 border-t border-[#e3e7ef] space-y-2">
            <span className="text-xs font-bold text-[#8b94a5] block">
              ترکیب سهم درآمدی (توزیع ۱۰۰ درصدی صندوق):
            </span>
            <div className="w-full h-4 rounded-xl overflow-hidden flex bg-slate-100 shadow-inner">
              {summary.methods.map((m) => {
                if (m.amount === 0) return null;
                const width = summary.totalSales > 0 ? (m.amount / summary.totalSales) * 100 : 0;
                return (
                  <div
                    key={m.method}
                    style={{ width: `${width}%`, backgroundColor: m.color }}
                    title={`${m.label}: ${formatRial(m.amount)} (${fa(m.percentage)}٪)`}
                    className="h-full transition-all"
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8b94a5] pt-1">
              <span>💳 کارتخوان: {summary.methods[0] ? fa(summary.methods[0].percentage) : '۰'}٪</span>
              <span>💵 نقد: {summary.methods[1] ? fa(summary.methods[1].percentage) : '۰'}٪</span>
              <span>⚖️ ترکیبی: {summary.methods[2] ? fa(summary.methods[2].percentage) : '۰'}٪</span>
            </div>
          </div>
        </div>

        {/* نمودار دوم: روند ساعتی فروش و ساعات اوج شلوغی (۵ ستون در دسکتاپ) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-[#e3e7ef]">
            <h3 className="text-base font-bold text-[#16202e]">
              نمودار میله‌ای توزیع ساعتی فروش
            </h3>
            <span className="text-xs text-[#8b94a5]">
              ساعات پرتردد سفارشات ناهار و شام (۱۱ الی ۲۳)
            </span>
          </div>

          {/* نمودار میله‌ای عمودی */}
          <div className="h-44 pt-4 flex items-end justify-between gap-1 border-b border-[#e3e7ef] pb-2">
            {summary.hourlyTrend.map((bucket) => {
              const heightPercent = bucket.percentageOfMax > 0 ? Math.max(8, bucket.percentageOfMax) : 4;
              const hasSales = bucket.amount > 0;

              return (
                <div
                  key={bucket.hourLabel}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* بالون تول‌تیپ شناور */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded shadow-lg whitespace-nowrap z-10">
                    {bucket.hourLabel}: {formatRial(bucket.amount)} ({fa(bucket.orderCount)} سفارش)
                  </div>

                  <div
                    className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${
                      hasSales
                        ? 'bg-[#e8590c] hover:bg-[#d04e0a]'
                        : 'bg-slate-100'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] text-[#8b94a5] mt-1 tabular-nums">
                    {fa(bucket.hourLabel.split(':')[0])}
                  </span>
                </div>
              );
            })}
          </div>

          {/* وضعیت تراکنش‌های مالی (FR-PAY-04) */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[#16202e] block">
              وضعیت تسویه‌حساب فاکتورها (FR-PAY-04):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {summary.statuses.map((statusItem) => (
                <div
                  key={statusItem.status}
                  className="p-2.5 rounded-xl border border-[#e3e7ef] bg-slate-50 space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8b94a5]">{statusItem.label}</span>
                    <span className="font-bold tabular-nums text-[#16202e]">
                      {fa(statusItem.count)} فاکتور
                    </span>
                  </div>
                  <div className="font-bold text-xs text-[#16202e] tabular-nums">
                    {formatRial(statusItem.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* هشدار برای سفارش‌های وضعیت نامشخص (Unknown) جهت تطبیق حسابداری */}
      {summary.statuses.find((s) => s.status === 'UNKNOWN' && s.count > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-[#b45309] flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-bold text-sm">
              توجه مدیر و حسابدار: تراکنش‌های پرداخت نامشخص (FR-PAY-04) نیاز به بررسی دارند
            </div>
            <p className="mt-1 leading-relaxed text-[#b45309]">
              یک یا چند فاکتور در وضعیت «نامشخص» کارتخوان ثبت شده‌اند. لطفاً قبل از بستن شیفت و تحویل وجه نقد صندوق، گزارش مغایرت رسیدهای پوز بانکی را بررسی نمایید.
            </p>
          </div>
        </div>
      )}

      {/* بخش هوشمند تحلیل میانگین فروش ساعتی جهت مدیریت پرسنل و چیدمان شیفت‌ها */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e7ef]">
          <div>
            <div className="text-xs font-bold text-[#e8590c]">مدیریت منابع انسانی و برنامه‌ریزی شیفت (E-07)</div>
            <h3 className="text-lg font-black text-[#16202e] flex items-center gap-2 mt-0.5">
              <span>تحلیل میانگین فروش ساعتی و تخصیص بهینه پرسنل رستوران</span>
            </h3>
            <p className="text-xs text-[#8b94a5] mt-1">
              برنامه‌ریزی دقیق تعداد صندوق‌داران و پرسنل خط پخت آشپزخانه بر اساس داده‌های سفارش‌های قبلی و اوج بار کاری
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-orange-50 text-[#e8590c] px-3.5 py-2 rounded-xl border border-orange-200 font-bold whitespace-nowrap">
            <span>🔥 ساعت اوج شلوغی (پیک):</span>
            <span className="tabular-nums">ساعت {fa(staffingReport.peakHour.hour)}:۰۰ ({formatRial(staffingReport.peakHour.totalSales)})</span>
          </div>
        </div>

        {/* ۳ کارت راهنمای چیدمان شیفت‌های کاری رستوران */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#e3e7ef] bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#16202e]">{staffingReport.totalShiftRoster.lunchShift.label}</span>
              <span className="text-[11px] text-[#8b94a5] tabular-nums">{staffingReport.totalShiftRoster.lunchShift.hours}</span>
            </div>
            <div className="text-sm font-black text-[#e8590c] tabular-nums">
              میانگین: {formatRial(staffingReport.totalShiftRoster.lunchShift.avgSales)}
            </div>
            <div className="text-xs font-bold text-[#188a4d] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              👥 چیدمان: {staffingReport.totalShiftRoster.lunchShift.staffAdvice}
            </div>
            <p className="text-[11px] text-[#8b94a5] leading-relaxed">
              {staffingReport.totalShiftRoster.lunchShift.desc}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#e3e7ef] bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#16202e]">{staffingReport.totalShiftRoster.afternoonShift.label}</span>
              <span className="text-[11px] text-[#8b94a5] tabular-nums">{staffingReport.totalShiftRoster.afternoonShift.hours}</span>
            </div>
            <div className="text-sm font-black text-[#4f46e5] tabular-nums">
              میانگین: {formatRial(staffingReport.totalShiftRoster.afternoonShift.avgSales)}
            </div>
            <div className="text-xs font-bold text-[#4f46e5] bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
              👥 چیدمان: {staffingReport.totalShiftRoster.afternoonShift.staffAdvice}
            </div>
            <p className="text-[11px] text-[#8b94a5] leading-relaxed">
              {staffingReport.totalShiftRoster.afternoonShift.desc}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#16202e]">{staffingReport.totalShiftRoster.dinnerShift.label}</span>
              <span className="text-[11px] text-[#8b94a5] tabular-nums">{staffingReport.totalShiftRoster.dinnerShift.hours}</span>
            </div>
            <div className="text-sm font-black text-[#dc2626] tabular-nums">
              میانگین: {formatRial(staffingReport.totalShiftRoster.dinnerShift.avgSales)}
            </div>
            <div className="text-xs font-bold text-[#dc2626] bg-red-100 px-2 py-1 rounded-lg border border-red-200">
              👥 چیدمان: {staffingReport.totalShiftRoster.dinnerShift.staffAdvice}
            </div>
            <p className="text-[11px] text-[#8b94a5] leading-relaxed">
              {staffingReport.totalShiftRoster.dinnerShift.desc}
            </p>
          </div>
        </div>

        {/* نمودار میله‌ای تفصیلی ساعات شبانه‌روز با بار کاری و پیشنهاد پرسنل */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#16202e]">
              نمودار میله‌ای میانگین فروش هر ساعت و نیازمندی کادر پرسنلی:
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8b94a5]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> اوج پیک (PEAK)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e8590c]" /> شلوغ (BUSY)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" /> متوسط</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#188a4d]" /> خلوت</span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pl-1">
            {staffingReport.hourlyInsights.map((insight) => {
              const isPeak = insight.workload === 'PEAK';
              const isBusy = insight.workload === 'BUSY';
              const isModerate = insight.workload === 'MODERATE';

              const barColor = isPeak
                ? '#dc2626'
                : isBusy
                ? '#e8590c'
                : isModerate
                ? '#4f46e5'
                : '#188a4d';

              const badgeBg = isPeak
                ? 'bg-red-100 text-[#dc2626] border-red-200'
                : isBusy
                ? 'bg-orange-100 text-[#e8590c] border-orange-200'
                : isModerate
                ? 'bg-indigo-100 text-[#4f46e5] border-indigo-200'
                : 'bg-emerald-100 text-[#188a4d] border-emerald-200';

              return (
                <div key={insight.hour} className="p-3 bg-slate-50/80 border border-[#e3e7ef] rounded-xl space-y-2 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#16202e] w-28 text-right tabular-nums">
                        ساعت {insight.hourRangeLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeBg}`}>
                        {insight.shiftPeriodName}
                      </span>
                      <span className="text-[#8b94a5]">·</span>
                      <span className="text-[11px] text-[#8b94a5] tabular-nums">
                        {fa(insight.orderCount)} سفارش
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[#8b94a5] text-[11px] ml-1">میانگین فروش:</span>
                        <span className="font-black text-[#16202e] tabular-nums">
                          {formatRial(insight.totalSales)}
                        </span>
                      </div>

                      <div className="px-2.5 py-1 bg-white border border-[#e3e7ef] rounded-lg text-[11px] font-bold text-[#16202e] shadow-2xs whitespace-nowrap">
                        👥 پرسنل لازم: <span className="text-[#e8590c]">{insight.staffingSummary}</span>
                      </div>
                    </div>
                  </div>

                  {/* میله نمودار بار کاری این ساعت */}
                  <div className="w-full h-3 bg-slate-200 rounded-md overflow-hidden flex items-center p-0.5">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${Math.max(6, insight.workloadScore)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>

                  {/* راهکار و توصیه اجرایی برای مدیر */}
                  <div className="text-[11px] text-[#8b94a5] flex items-center gap-1.5 pt-0.5">
                    <span className="font-bold text-slate-700">📌 راهنمای مدیر:</span>
                    <span>{insight.operationalAdvice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* جدول فهرست جزئیات سفارش‌ها و امکان فیلتر بر اساس روش پرداخت */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#e3e7ef] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#16202e]">ریز تراکنش‌های فروش روز جاری</h3>
            <span className="text-xs text-[#8b94a5]">
              نمایش اقلام و تفکیک روش تسویه فاکتورها
            </span>
          </div>

          {/* تب‌های فیلتر روش پرداخت */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedMethodFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedMethodFilter === 'ALL'
                  ? 'bg-white text-[#16202e] shadow-xs'
                  : 'text-[#8b94a5] hover:text-[#16202e]'
              }`}
            >
              همه ({fa(orders.length)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethodFilter('POS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedMethodFilter === 'POS'
                  ? 'bg-white text-[#e8590c] shadow-xs'
                  : 'text-[#8b94a5] hover:text-[#16202e]'
              }`}
            >
              فقط کارتخوان
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethodFilter('CASH')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedMethodFilter === 'CASH'
                  ? 'bg-white text-[#188a4d] shadow-xs'
                  : 'text-[#8b94a5] hover:text-[#16202e]'
              }`}
            >
              فقط نقدی
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethodFilter('SPLIT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedMethodFilter === 'SPLIT'
                  ? 'bg-white text-[#4f46e5] shadow-xs'
                  : 'text-[#8b94a5] hover:text-[#16202e]'
              }`}
            >
              فقط ترکیبی
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-[#e3e7ef] text-[#8b94a5] font-bold">
              <tr>
                <th className="py-3 px-4">شماره فاکتور</th>
                <th className="py-3 px-4">زمان ثبت</th>
                <th className="py-3 px-4">نوع سفارش و مشتری</th>
                <th className="py-3 px-4">اقلام غذا</th>
                <th className="py-3 px-4">مبلغ فاکتور</th>
                <th className="py-3 px-4">روش پرداخت</th>
                <th className="py-3 px-4">وضعیت تسویه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e7ef]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8b94a5]">
                    هیچ سفارشی با روش پرداخت انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const method = order.payment?.method || 'POS';
                  const status = order.payment?.status || 'CONFIRMED';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-[#e8590c] tabular-nums">
                        #{fa(order.dailySequence)}
                      </td>
                      <td className="py-3 px-4 text-[#8b94a5] tabular-nums">
                        {formatTime(order.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#16202e]">
                          {order.customer ? order.customer.name : 'مشتری مهمان'}
                        </div>
                        <div className="text-[11px] text-[#8b94a5]">
                          {order.orderType === 'DINE_IN'
                            ? `سالن (میز ${fa(order.tableNumber)})`
                            : order.orderType === 'TAKEAWAY'
                            ? 'بیرون‌بر'
                            : 'پیک'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#8b94a5]">
                        {order.items.map((i) => `${i.menuItem.name} (${fa(i.quantity)})`).join('، ')}
                      </td>
                      <td className="py-3 px-4 font-black text-sm text-[#16202e] tabular-nums">
                        {formatRial(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                            method === 'POS'
                              ? 'bg-orange-50 text-[#e8590c] border border-orange-200'
                              : method === 'CASH'
                              ? 'bg-emerald-50 text-[#188a4d] border border-emerald-200'
                              : 'bg-indigo-50 text-[#4f46e5] border border-indigo-200'
                          }`}
                        >
                          {method === 'POS' ? 'کارتخوان' : method === 'CASH' ? 'نقد' : 'ترکیبی'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            status === 'CONFIRMED'
                              ? 'bg-[#e8f7ee] text-[#188a4d]'
                              : status === 'UNKNOWN'
                              ? 'bg-amber-100 text-[#b45309]'
                              : status === 'PENDING'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-[#dc2626]'
                          }`}
                        >
                          {status === 'CONFIRMED'
                            ? 'تأیید شد ✓'
                            : status === 'UNKNOWN'
                            ? 'نامشخص ❓'
                            : status === 'PENDING'
                            ? 'در انتظار ⏳'
                            : 'ناموفق ✕'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
