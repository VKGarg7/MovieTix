export const getBookingStatus = (booking) => {
  if (booking.status === "cancelled") return booking.isPaid ? "refunded" : "cancelled";
  if (booking.status === "pending-cancellation") return "refunded";
  if (booking.status === "pending") return "pending";
  if (booking.concessionPickedUp) return "completed";
  if (booking.status === "confirmed") return "confirmed";
  return "pending";
};

export const getPaymentStatus = (booking) => {
  if (booking.isPaid && booking.status !== "cancelled" && booking.status !== "pending-cancellation") return "paid";
  if (booking.isPaid && (booking.status === "cancelled" || booking.status === "pending-cancellation")) return "refunded";
  if (!booking.isPaid && booking.status === "cancelled") return "failed";
  return "pending";
};
