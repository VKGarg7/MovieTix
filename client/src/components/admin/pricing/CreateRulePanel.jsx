import React from "react";
import { motion } from "framer-motion";
import { ZapIcon, LockIcon } from "lucide-react";
import Select from "../Select";
import WeekScheduler from "./WeekScheduler";
import TimeRangeSlider from "./TimeRangeSlider";
import LivePricePreview from "./LivePricePreview";

const TYPE_OPTIONS = [
  { value: "time_of_week", label: "Time-of-week surcharge" },
  { value: "early_bird", label: "Early-bird discount" },
  { value: "holiday", label: "Holiday (coming soon)" },
  { value: "festival", label: "Festival (coming soon)" },
  { value: "dynamic_occupancy", label: "Dynamic Occupancy (coming soon)" },
  { value: "seat_type", label: "Seat Type (coming soon)" },
  { value: "movie_format", label: "Movie Format (coming soon)" },
  { value: "weather", label: "Weather (coming soon)" },
  { value: "special_event", label: "Special Event (coming soon)" },
  { value: "manual_override", label: "Manual Override (coming soon)" },
];

const ADJUSTMENT_TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed (coming soon)" },
  { value: "multiplier", label: "Multiplier (coming soon)" },
];

const FieldLabel = ({ children, locked }) => (
  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
    {children}
    {locked && <LockIcon className="w-3 h-3 text-gray-600" />}
  </label>
);

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed";

const CreateRulePanel = ({ form, setForm, theaters, onToggleDay, onSubmit, creating, currency }) => {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isTimeOfWeek = form.type === "time_of_week";

  return (
    <div className="glass-panel !rounded-3xl p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
      <div>
        <h2 className="font-display text-xl font-medium">Create Pricing Rule</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Adjust ticket pricing dynamically based on demand signals.</p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel>Rule Name</FieldLabel>
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              placeholder="Weekend evening surcharge"
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel>Rule Type</FieldLabel>
            <Select value={form.type} onChange={update("type")} options={TYPE_OPTIONS} className="!w-full !py-2" />
          </div>

          <div>
            <FieldLabel>Adjustment Type</FieldLabel>
            <Select value={form.adjustmentType} onChange={update("adjustmentType")} options={ADJUSTMENT_TYPE_OPTIONS} className="!w-full !py-2" />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel>Adjustment Value (%) — positive surcharges, negative discounts</FieldLabel>
            <input
              type="number"
              value={form.adjustmentPercent}
              onChange={update("adjustmentPercent")}
              placeholder="e.g. 20 or -10"
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel locked>Applicable Theater</FieldLabel>
            <Select
              value={form.theaterId}
              onChange={update("theaterId")}
              options={[{ value: "", label: "All Theaters (Global)" }, ...theaters.map((t) => ({ value: t._id, label: t.name }))]}
              className="!w-full !py-2"
            />
          </div>

          <div>
            <FieldLabel locked>Priority</FieldLabel>
            <input type="number" value={form.priority} onChange={update("priority")} disabled className={inputCls} placeholder="Coming soon" />
          </div>

          {isTimeOfWeek ? (
            <>
              <div className="sm:col-span-2">
                <FieldLabel>Applicable Days</FieldLabel>
                <WeekScheduler selectedDays={form.daysOfWeek} onToggle={onToggleDay} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Time Range</FieldLabel>
                <TimeRangeSlider
                  startHour={Number(form.startHour)}
                  endHour={Number(form.endHour)}
                  onChange={({ startHour, endHour }) => setForm((f) => ({ ...f, startHour, endHour }))}
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <FieldLabel>Minimum Days Before Show</FieldLabel>
              <input
                type="number"
                min="0"
                value={form.minDaysBeforeShow}
                onChange={update("minDaysBeforeShow")}
                className={inputCls}
              />
            </div>
          )}

          <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {[
              { key: "seatCategories", label: "Seat Categories", locked: true },
              { key: "conflictResolution", label: "Conflict Resolution", locked: true },
              { key: "isActive", label: "Active", locked: false },
            ].map(({ key, label, locked }) => (
              <label key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-xs ${locked ? "opacity-40" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  disabled={locked}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="sm:col-span-2 pt-2">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={creating}
              className="btn-glow w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-primary via-nebula-magenta to-nebula-violet text-white disabled:opacity-50 cursor-pointer"
            >
              <ZapIcon className="w-4 h-4" />
              {creating ? "Creating…" : "Create Rule"}
            </motion.button>
          </div>
        </form>
      </div>

      <LivePricePreview form={form} currency={currency} />
    </div>
  );
};

export default CreateRulePanel;
