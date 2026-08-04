import React from "react";

const PillOptionSelector = ({ options, value, onChange, renderLabel, circular = false }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const selected = value === option;
      return (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`${circular ? "w-7 h-7 rounded-full" : "px-3 py-1.5 rounded-full"} text-xs border cursor-pointer transition
            ${selected
              ? "bg-primary text-white border-primary"
              : "bg-primary/10 border-primary/30 text-gray-300 hover:bg-primary/20"}`}
        >
          {renderLabel ? renderLabel(option) : option}
        </button>
      );
    })}
  </div>
);

export default PillOptionSelector;
