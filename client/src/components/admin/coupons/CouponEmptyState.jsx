import { TicketIcon } from "lucide-react";
import EmptyState from "../EmptyState";

const CouponEmptyState = ({ onCreate, filtered = false, onReset }) => (
  <EmptyState
    icon={TicketIcon}
    tone="primary"
    filtered={filtered}
    title="No promotions yet"
    filteredTitle="No promotions match your filters"
    description="Create your first coupon to start driving bookings with discounts."
    filteredDescription="Try adjusting or resetting your filters to see more results."
    onPrimaryAction={onCreate}
    primaryLabel="Create your first coupon"
    onReset={onReset}
    iconMotionProps={{ animate: { rotate: [0, -6, 6, 0] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
  />
);

export default CouponEmptyState;
