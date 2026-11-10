import React from 'react';
import { Order, OrderStatus, UserProfile } from '../domain/types';
import { fa, formatTime } from '../domain/formatters';

interface KitchenViewProps {
  orders: Order[];
  currentUser: UserProfile;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  orders,
  currentUser,
  onUpdateStatus,
}) => {
  // تیکت‌های آشپزخانه (به جز موارد لغو شده یا تکمیل شده قدیمی)
  const activeOrders = orders.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY'
  );

  return (
    <div className="space-y-6">
      {/* سربرگ بخش آشپزخانه */}
      <div className="bg-white rounded-2xl border border-[#e3e7ef] p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#188a4d]">نمای اختصاصی سرآشپز و خط طبخ</div>
          <h2 className="text-xl font-bold text-[#16202e] flex items-center gap-2 mt-0.5">
            <span>صف تیکت‌های پخت غذا (KOT Queue)</span>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#e8f7ee] text-[#188a4d] rounded-full">
              {fa(activeOrders.length)} سفارش فعال
            </span>
          </h2>
        </div>
        <div className="text-xs text-[#8b94a5] bg-slate-50 px-3 py-1.5 rounded-xl border border-[#e3e7ef]">
          🔒 استاندارد FR-ORD-11: در پنل آشپزخانه هیچ‌گونه مبلغ یا اطلاعات مالی نمایش داده نمی‌شود.
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e3e7ef] p-16 text-center space-y-3">
          <div className="text-5xl">👨‍🍳</div>
          <h3 className="text-base font-bold text-[#16202e]">صف آشپزخانه در حال حاضر خالی است</h3>
          <p className="text-xs text-[#8b94a5]">
            به محض تأیید سفارش در صندوق، تیکت‌های پخت غذا به‌صورت خودکار در این صفحه ظاهر می‌شوند.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map((order) => {
            const isPreparing = order.status === 'PREPARING';
            const isReady = order.status === 'READY';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                  isReady
                    ? 'border-emerald-300 ring-1 ring-emerald-300'
                    : isPreparing
                    ? 'border-amber-300 ring-1 ring-amber-300'
                    : 'border-[#e3e7ef]'
                }`}
              >
                <div className="space-y-4">
                  {/* ردیف بالا: شماره سفارش و وضعیت */}
                  <div className="flex items-center justify-between border-b border-[#e3e7ef] pb-3">
                    <div>
                      <span className="text-[11px] text-[#8b94a5] block">شماره سفارش:</span>
                      <span className="font-mono text-2xl font-black text-[#e8590c]">
                        #{fa(order.dailySequence)}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isReady
                          ? 'bg-[#e8f7ee] text-[#188a4d]'
                          : isPreparing
                          ? 'bg-[#fef3c7] text-[#b45309]'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {isReady
                        ? 'آماده تحویل ✓'
                        : isPreparing
                        ? 'در حال پخت 🍳'
                        : 'در انتظار پخت ⏳'}
                    </span>
                  </div>

                  {/* نوع تحویل و زمان ثبت */}
                  <div className="flex items-center justify-between text-xs text-[#8b94a5]">
                    <span className="font-bold text-[#16202e]">
                      {order.orderType === 'DINE_IN'
                        ? `میز ${fa(order.tableNumber)} (سالن)`
                        : order.orderType === 'TAKEAWAY'
                        ? 'بسته‌بندی بیرون‌بر'
                        : 'پیک موتوری'}
                    </span>
                    <span>ثبت: {formatTime(order.createdAt)}</span>
                  </div>

                  {/* یادداشت کلی */}
                  {order.kitchenNote && (
                    <div className="p-2 bg-amber-50 rounded-lg text-xs font-bold text-[#b45309] border border-amber-200">
                      یادداشت: {order.kitchenNote}
                    </div>
                  )}

                  {/* لیست اقلام با یادداشت‌های ویژه */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-[#8b94a5]">اقلام جهت طبخ:</div>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-slate-50 rounded-xl border border-[#e3e7ef] flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#16202e]">
                            {item.menuItem.name}
                          </div>
                          {item.note && (
                            <div className="text-[11px] font-bold text-[#e8590c] mt-0.5">
                              👉 {item.note}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-black text-white bg-[#16202e] px-2 py-0.5 rounded-md tabular-nums">
                          {fa(item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* دکمه‌های تغییر وضعیت پخت */}
                <div className="pt-4 border-t border-[#e3e7ef] mt-4 flex items-center gap-2">
                  {!isPreparing && !isReady && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      شروع پخت سفارش
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(order.id, 'READY')}
                      className="w-full py-2 bg-[#188a4d] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      اعلام آماده شدن غذا ✓
                    </button>
                  )}

                  {isReady && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      تحویل به مشتری و آزادسازی میز
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
