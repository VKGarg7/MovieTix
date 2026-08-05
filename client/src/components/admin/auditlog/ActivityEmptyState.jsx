import { ActivityIcon } from "lucide-react";
import EmptyState from "../EmptyState";

const ActivityEmptyState = ({ filtered = false, onReset }) => (
  <EmptyState
    icon={ActivityIcon}
    tone="violet"
    filtered={filtered}
    title="No activity recorded yet"
    filteredTitle="No events match your filters"
    description="Actions across shows, theaters, screens and movies will appear here."
    filteredDescription="Try adjusting or resetting your filters to see more results."
    onReset={onReset}
    iconMotionProps={{ animate: { opacity: [1, 0.4, 1] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
  />
);

export default ActivityEmptyState;
