export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getRuleStatus = (rule) => (rule.isActive ? "active" : "paused");

export const describeRule = (rule) => {
  if (rule.type === 'time_of_week') {
    return `${(rule.daysOfWeek || []).map((d) => DAY_LABELS[d]).join(', ')}, ${rule.startHour}:00–${rule.endHour}:00`;
  }
  return `Booked ≥ ${rule.minDaysBeforeShow} days before showtime`;
};

export const getRuleConditionPills = (rule) => {
  if (rule.type === 'time_of_week') {
    const days = (rule.daysOfWeek || []).map((d) => DAY_LABELS[d]);
    return [...days, `${String(rule.startHour).padStart(2, '0')}:00-${String(rule.endHour).padStart(2, '0')}:00`];
  }
  return [`≥ ${rule.minDaysBeforeShow}d before show`];
};

export const estimateMonthlyRevenueImpact = (rule, avgTicketPrice = 250, avgMonthlyBookings = 400) => {
  const scope = rule.theaterId ? 0.3 : 1;
  const impact = avgTicketPrice * avgMonthlyBookings * scope * (rule.adjustmentPercent / 100) * 0.5;
  return Math.round(impact);
};

export const getRuleInsights = (rule) => {
  const insights = [];
  if (rule.type === 'time_of_week' && (rule.daysOfWeek || []).some((d) => d === 5 || d === 6) && rule.adjustmentPercent > 0 && rule.adjustmentPercent < 15) {
    insights.push({ label: "Weekend demand increasing — consider raising multiplier by 5%", tone: "cyan" });
  }
  if (rule.type === 'time_of_week' && (rule.startHour ?? 0) < 12 && rule.adjustmentPercent >= 0) {
    insights.push({ label: "Morning shows underperform — try a 10% discount", tone: "amber" });
  }
  if (rule.type === 'early_bird' && rule.adjustmentPercent < 0) {
    insights.push({ label: "Early-bird discount is driving advance bookings", tone: "violet" });
  }
  if (rule.adjustmentPercent >= 25) {
    insights.push({ label: "High surcharge — monitor occupancy for drop-off", tone: "primary" });
  }
  return insights;
};
