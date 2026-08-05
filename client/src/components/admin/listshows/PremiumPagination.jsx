import PaginationShell from "../PaginationShell";

const PremiumPagination = ({ page, totalPages, onPageChange, totalCount, pageSize, onPageSizeChange, label = "shows total" }) => {
  return <PaginationShell page={page} totalPages={totalPages} onPageChange={onPageChange} totalCount={totalCount} pageSize={pageSize} onPageSizeChange={onPageSizeChange} label={label} />;
};

export default PremiumPagination;
