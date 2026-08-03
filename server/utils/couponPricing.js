export const computeDiscount = (coupon, amount) => {
    const rawDiscount = coupon.type === 'percent'
        ? (amount * coupon.value) / 100
        : coupon.value;
    return Math.min(amount, Math.max(0, rawDiscount));
};
