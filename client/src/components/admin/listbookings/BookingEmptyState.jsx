import { TicketIcon } from "lucide-react";
import EmptyState from "../EmptyState";

const BookingEmptyState = ({ filtered = false, onReset }) => (
  <EmptyState
    icon={TicketIcon}
    tone="violet"
    filtered={filtered}
    title="No bookings yet"
    filteredTitle="No bookings match your filters"
    description="Bookings will appear here once customers start booking shows."
    filteredDescription="Try adjusting or resetting your filters to see more results."
    onReset={onReset}
  />
);

export default BookingEmptyState;
