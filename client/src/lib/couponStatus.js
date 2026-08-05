export const getCouponStatus = (coupon, now = Date.now()) => {
  if (!coupon.isActive) return "paused";
  const expiry = new Date(coupon.expiryDate).getTime();
  if (expiry < now) return "expired";
  const created = new Date(coupon.createdAt).getTime();
  if (created > now) return "scheduled";
  return "active";
};

export const getCouponInsights = (coupon, status) => {
  const insights = [];
  const usageRatio = coupon.usageLimit > 0 ? coupon.usedCount / coupon.usageLimit : 0;

  if (status === "active" && usageRatio < 0.15) {
    insights.push({ label: "Underperforming — consider promoting or extending validity", tone: "primary" });
  }
  if (usageRatio >= 0.85 && status === "active") {
    insights.push({ label: "High redemption rate — recommend increasing usage limit", tone: "cyan" });
  }
  if (status === "expired" && usageRatio < 0.3) {
    insights.push({ label: "Low uptake before expiry — try a longer validity window next time", tone: "amber" });
  }
  if (usageRatio >= 0.5) {
    insights.push({ label: "Frequently used by repeat customers", tone: "violet" });
  }

  return insights;
};
