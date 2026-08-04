import React from "react";

const InlineSpinner = ({ className = "h-40 mt-4" }) => (
  <div className={`flex justify-center items-center ${className}`}>
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-primary"></div>
  </div>
);

export default InlineSpinner;
