import { ZapIcon } from "lucide-react";
import EmptyState from "../EmptyState";

const RuleEmptyState = ({ onCreate, filtered = false, onReset }) => (
  <EmptyState
    icon={ZapIcon}
    tone="violet"
    filtered={filtered}
    title="No pricing rules found"
    filteredTitle="No pricing rules match your filters"
    description="Create your first optimization rule to start adjusting prices dynamically."
    filteredDescription="Try adjusting or resetting your filters to see more results."
    onPrimaryAction={onCreate}
    primaryLabel="Create your first optimization rule"
    onReset={onReset}
    iconMotionProps={{ animate: { scale: [1, 1.08, 1] }, transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
  />
);

export default RuleEmptyState;
