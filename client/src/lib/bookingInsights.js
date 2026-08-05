export const getBookingInsights = (booking, customerBookingCount) => {
  const insights = [];

  if (booking.status === "pending" && booking.amount > 0) {
    insights.push({ label: "High Cancellation Risk", tone: "primary" });
  }
  if (customerBookingCount >= 5) {
    insights.push({ label: "VIP Customer", tone: "amber" });
  } else if (customerBookingCount >= 2) {
    insights.push({ label: "Repeat Customer", tone: "cyan" });
  }
  if (booking.status === "cancelled" && booking.isPaid && booking.discountAmount > 0) {
    insights.push({ label: "Potential Refund Fraud", tone: "primary" });
  }
  if (customerBookingCount >= 3) {
    insights.push({ label: "Frequent Visitor", tone: "violet" });
  }

  return insights;
};
