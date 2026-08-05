import { UtensilsIcon } from "lucide-react";
import EmptyState from "../EmptyState";

const MenuEmptyState = ({ onAdd, filtered = false, onReset }) => (
  <EmptyState
    icon={UtensilsIcon}
    tone="primary"
    filtered={filtered}
    title="No menu items yet"
    filteredTitle="No menu items match your filters"
    description="Add your first concession item to start building your menu."
    filteredDescription="Try adjusting or resetting your filters to see more results."
    onPrimaryAction={onAdd}
    primaryLabel="Add your first item"
    onReset={onReset}
    iconMotionProps={{ animate: { y: [0, -6, 0] }, transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
  />
);

export default MenuEmptyState;
