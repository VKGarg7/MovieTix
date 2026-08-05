import React from "react";

const Select = ({ value, onChange, options, className = "", ...rest }) => (
  <select
    value={value}
    onChange={onChange}
    className={`bg-[#1f1f24] text-white border border-primary/30 rounded px-2 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    {...rest}
  >
    {options.map(({ value: optionValue, label }) => (
      <option key={optionValue} value={optionValue} className="bg-[#1f1f24] text-white">
        {label}
      </option>
    ))}
  </select>
);

export default Select;
