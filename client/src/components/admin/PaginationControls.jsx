import React from "react";

const PaginationControls = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-4 mt-4 text-sm">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Previous
      </button>
      <span className="text-gray-400">Page {page} of {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Next
      </button>
    </div>
  );
};

export default PaginationControls;
