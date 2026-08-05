import PaginationShell from "./PaginationShell";

const PaginationControls = ({ page, totalPages, onPageChange }) => {
  return <PaginationShell page={page} totalPages={totalPages} onPageChange={onPageChange} simple />;
};

export default PaginationControls;
