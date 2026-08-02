import React from "react";
import { SearchIcon, XIcon } from "lucide-react";

const SearchInput = ({ value, onChange, onClear, placeholder = "Search...", className = "" }) => (
  <div className={`relative w-full max-w-md ${className}`}>
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 pl-9 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        aria-label="Clear search"
      >
        <XIcon className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default SearchInput;
