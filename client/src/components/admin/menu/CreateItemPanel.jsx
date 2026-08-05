import React from "react";
import { motion } from "framer-motion";
import { PlusIcon, LockIcon } from "lucide-react";
import Select from "../Select";
import ImageUploadField from "./ImageUploadField";
import LiveMenuPreview from "./LiveMenuPreview";
import { CATEGORY_OPTIONS } from "../../../lib/menuItemStatus";

const SIZE_OPTIONS = [
  { value: "", label: "No size (single)" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xl", label: "XL" },
];

const TAX_OPTIONS = [
  { value: "standard", label: "Standard GST" },
  { value: "reduced", label: "Reduced GST (coming soon)" },
  { value: "exempt", label: "Tax Exempt (coming soon)" },
];

const FieldLabel = ({ children, locked }) => (
  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
    {children}
    {locked && <LockIcon className="w-3 h-3 text-gray-600" />}
  </label>
);

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed";

const CreateItemPanel = ({ form, setForm, theaters, onSubmit, creating, currency }) => {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="glass-panel !rounded-3xl p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
      <div>
        <h2 className="font-display text-xl font-medium">Create Menu Item</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Add food, beverages and combos to your concessions menu.</p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel>Item Name</FieldLabel>
            <input type="text" value={form.name} onChange={update("name")} placeholder="Popcorn (Large)" className={inputCls} />
          </div>

          <div>
            <FieldLabel>Category</FieldLabel>
            <Select value={form.category} onChange={update("category")} options={CATEGORY_OPTIONS} className="!w-full !py-2" />
          </div>

          <div>
            <FieldLabel>Price ({currency})</FieldLabel>
            <input type="number" value={form.price} onChange={update("price")} className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <textarea value={form.description} onChange={update("description")} rows={2} placeholder="Freshly popped, extra butter" className={`${inputCls} resize-none`} />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel>Image</FieldLabel>
            <ImageUploadField value={form.imageUrl} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} />
          </div>

          <div>
            <FieldLabel>Size</FieldLabel>
            <Select value={form.size} onChange={update("size")} options={SIZE_OPTIONS} className="!w-full !py-2" />
          </div>

          <div>
            <FieldLabel>Theater</FieldLabel>
            <Select
              value={form.theaterId}
              onChange={update("theaterId")}
              options={[{ value: "", label: "My Theater" }, ...theaters.map((t) => ({ value: t._id, label: `${t.name} (${t.city})` }))]}
              className="!w-full !py-2"
            />
          </div>

          <div>
            <FieldLabel locked>Preparation Time (min)</FieldLabel>
            <input type="number" value={form.prepTime} onChange={update("prepTime")} disabled className={inputCls} placeholder="Coming soon" />
          </div>

          <div>
            <FieldLabel locked>Calories</FieldLabel>
            <input type="number" value={form.calories} onChange={update("calories")} disabled className={inputCls} placeholder="Coming soon" />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel locked>Tax Category</FieldLabel>
            <Select value={form.taxCategory} onChange={update("taxCategory")} options={TAX_OPTIONS} className="!w-full !py-2" disabled />
          </div>

          <div className="sm:col-span-2 grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-xs cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} className="accent-primary cursor-pointer" />
              Available
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-xs opacity-40">
              <input type="checkbox" checked={form.isFeatured} disabled className="accent-primary cursor-not-allowed" />
              Featured <LockIcon className="w-3 h-3 text-gray-600 ml-auto" />
            </label>
          </div>

          <div className="sm:col-span-2 pt-2">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={creating}
              className="btn-glow w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-primary via-nebula-magenta to-nebula-violet text-white disabled:opacity-50 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              {creating ? "Creating…" : "Add Item"}
            </motion.button>
          </div>
        </form>
      </div>

      <LiveMenuPreview form={form} currency={currency} />
    </div>
  );
};

export default CreateItemPanel;
