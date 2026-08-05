import { ClapperboardIcon, PlusIcon } from "lucide-react";
import EmptyState from "../EmptyState";

const ShowEmptyState = ({ onAddShow, filtered = false, onReset }) => (
  <EmptyState
    icon={ClapperboardIcon}
    tone="primary"
    filtered={filtered}
    title="Schedule your first screening"
    filteredTitle="No shows match your filters"
    description="Add a show to start managing screenings across your theaters."
    filteredDescription="Try adjusting or resetting your filters to see more results."
    onPrimaryAction={onAddShow}
    primaryLabel={<><PlusIcon className="w-4 h-4" /> Add Show</>}
    onReset={onReset}
  />
);

export default ShowEmptyState;
