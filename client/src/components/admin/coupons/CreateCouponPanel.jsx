import React from "react";
import { motion } from "framer-motion";
import { SparklesIcon, LockIcon } from "lucide-react";
import Select from "../Select";
import LiveCouponPreview from "./LiveCouponPreview";

const TYPE_OPTIONS = [
  { value: "percent", label: "Percentage" },
  { value: "flat", label: "Flat" },
  { value: "bogo", label: "BOGO (coming soon)" },
  { value: "cashback", label: "Cashback (coming soon)" },
];

const THEME_OPTIONS = [
  { value: "sunset", label: "Sunset" },
  { value: "ocean", label: "Ocean" },
  { value: "violet", label: "Violet" },
];

const FieldLabel = ({ children, locked }) => (
  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
    {children}
    {locked && <LockIcon className="w-3 h-3 text-gray-600" />}
  </label>
);

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed";

const CreateCouponPanel = ({ form, setForm, theaters, onSubmit, creating }) => {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isFlatOrPercent = form.type === "percent" || form.type === "flat";

  return (
    <div className="glass-panel !rounded-3xl p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
      <div>
        <h2 className="font-display text-xl font-medium">Create New Promotion</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Create discount campaigns for movies and bookings.</p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Coupon Code</FieldLabel>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SAVE20"
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel>Discount Type</FieldLabel>
            <Select
              value={form.type}
              onChange={update("type")}
              options={TYPE_OPTIONS}
              className="!w-full !py-2"
            />
          </div>

          <div>
            <FieldLabel>Discount Value {form.type === "percent" ? "(%)" : "(₹)"}</FieldLabel>
            <input
              type="number"
              value={form.value}
              onChange={update("value")}
              disabled={!isFlatOrPercent}
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel locked>Maximum Discount (₹)</FieldLabel>
            <input type="number" value={form.maxDiscount} onChange={update("maxDiscount")} disabled className={inputCls} placeholder="Coming soon" />
          </div>

          <div>
            <FieldLabel locked>Minimum Booking Amount (₹)</FieldLabel>
            <input type="number" value={form.minAmount} onChange={update("minAmount")} disabled className={inputCls} placeholder="Coming soon" />
          </div>

          <div>
            <FieldLabel>Usage Limit</FieldLabel>
            <input type="number" value={form.usageLimit} onChange={update("usageLimit")} className={inputCls} />
          </div>

          <div>
            <FieldLabel locked>Per User Limit</FieldLabel>
            <input type="number" value={form.perUserLimit} onChange={update("perUserLimit")} disabled className={inputCls} placeholder="Coming soon" />
          </div>

          <div>
            <FieldLabel>Priority</FieldLabel>
            <input type="number" value={form.priority} onChange={update("priority")} disabled className={inputCls} placeholder="Coming soon" />
          </div>

          <div>
            <FieldLabel locked>Valid From</FieldLabel>
            <input type="date" value={form.validFrom} onChange={update("validFrom")} disabled className={inputCls} />
          </div>

          <div>
            <FieldLabel>Expiry Date</FieldLabel>
            <input type="date" value={form.expiryDate} onChange={update("expiryDate")} className={inputCls} />
          </div>

          <div>
            <FieldLabel locked>Applicable Theater</FieldLabel>
            <Select
              value={form.theaterId}
              onChange={update("theaterId")}
              options={[{ value: "", label: "All Theaters" }, ...theaters.map((t) => ({ value: t._id, label: t.name }))]}
              className="!w-full !py-2"
            />
          </div>

          <div>
            <FieldLabel locked>Coupon Color Theme</FieldLabel>
            <Select value={form.theme} onChange={update("theme")} options={THEME_OPTIONS} className="!w-full !py-2" />
          </div>

          <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {[
              { key: "mysteryShows", label: "Mystery Shows", locked: true },
              { key: "autoApply", label: "Auto Apply", locked: true },
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
              <SparklesIcon className="w-4 h-4" />
              {creating ? "Creating…" : "Create Coupon"}
            </motion.button>
          </div>
        </form>
      </div>

      <LiveCouponPreview form={form} />
    </div>
  );
};

export default CreateCouponPanel;
