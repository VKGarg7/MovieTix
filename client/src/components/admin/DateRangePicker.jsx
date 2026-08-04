import React from "react";

const toInputValue = (date) => (date ? new Date(date).toISOString().slice(0, 10) : "");

const DateRangePicker = ({ from, to, onChange }) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col text-sm text-gray-400 gap-1">
        From
        <input
          type="date"
          value={toInputValue(from)}
          max={toInputValue(to) || undefined}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="bg-primary/10 border border-primary/20 rounded-md px-3 py-2 text-white outline-none"
        />
      </label>
      <label className="flex flex-col text-sm text-gray-400 gap-1">
        To
        <input
          type="date"
          value={toInputValue(to)}
          min={toInputValue(from) || undefined}
          max={toInputValue(new Date())}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="bg-primary/10 border border-primary/20 rounded-md px-3 py-2 text-white outline-none"
        />
      </label>
    </div>
  );
};

export default DateRangePicker;
