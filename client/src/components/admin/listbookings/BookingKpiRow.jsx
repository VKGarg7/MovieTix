import React, { useMemo } from "react";
import { TicketIcon, CalendarClockIcon, BanknoteIcon, ReceiptIcon, PercentIcon, GaugeIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";

const BookingKpiRow = ({ bookings, currency }) => {
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let todayCount = 0, revenue = 0, cancelled = 0, seatSum = 0, capacitySum = 0;

    bookings.forEach((b) => {
      const isToday = new Date(b.createdAt).toDateString() === todayStr;
      if (isToday) todayCount += 1;
      if (b.isPaid && b.status !== "cancelled") revenue += b.amount;
      if (b.status === "cancelled" || b.status === "pending-cancellation") cancelled += 1;
      seatSum += (b.bookedSeats?.length || 0);
      const cap = b.show?.screen?.totalCapacity;
      if (cap) capacitySum += cap;
    });

    const paidCount = bookings.filter((b) => b.isPaid && b.status !== "cancelled").length;

    return {
      total: bookings.length,
      todayCount,
      revenue,
      avgTicket: paidCount > 0 ? Math.round(revenue / paidCount) : 0,
      cancellationRate: bookings.length > 0 ? Math.round((cancelled / bookings.length) * 100) : 0,
      occupancy: capacitySum > 0 ? Math.round((seatSum / capacitySum) * 100) : 0,
    };
  }, [bookings]);

  const cards = [
    { icon: TicketIcon, label: "Total Bookings", value: stats.total, tone: "primary" },
    { icon: CalendarClockIcon, label: "Today's Bookings", value: stats.todayCount, tone: "violet" },
    { icon: BanknoteIcon, label: "Revenue", value: stats.revenue, prefix: currency, tone: "primary" },
    { icon: ReceiptIcon, label: "Avg Ticket Price", value: stats.avgTicket, prefix: currency, tone: "violet" },
    { icon: PercentIcon, label: "Cancellation Rate", value: stats.cancellationRate, tone: "primary" },
    { icon: GaugeIcon, label: "Occupancy", value: stats.occupancy, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} prefix={c.prefix} tone={c.tone} i={i} />
      ))}
    </div>
  );
};

export default BookingKpiRow;
