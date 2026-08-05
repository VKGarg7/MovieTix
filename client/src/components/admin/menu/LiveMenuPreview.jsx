import React from "react";
import { motion } from "framer-motion";
import { UtensilsIcon, StarIcon } from "lucide-react";
import { CATEGORY_OPTIONS } from "../../../lib/menuItemStatus";

const LiveMenuPreview = ({ form, currency }) => {
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label || "Snacks";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="sticky top-20">
      <p className="text-xs text-gray-500 mb-3">Live Preview</p>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="relative h-40 w-full bg-gradient-to-br from-primary/20 to-nebula-violet/20 flex items-center justify-center">
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <UtensilsIcon className="w-10 h-10 text-white/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md border ${
            form.isAvailable ? "bg-nebula-cyan/15 border-nebula-cyan/40 text-nebula-cyan" : "bg-primary/80 border-primary/50 text-white"
          }`}>
            {form.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
          </span>

          {form.isFeatured && (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-nebula-amber/20 border border-nebula-amber/40 text-nebula-amber backdrop-blur-md">
              <StarIcon className="w-2.5 h-2.5 fill-current" /> Featured
            </span>
          )}

          <p className="absolute bottom-2 left-2.5 right-2.5 font-medium text-sm truncate">{form.name || "New Item"}</p>
        </div>

        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-300 capitalize">{categoryLabel}</span>
            {form.size && <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-300 uppercase">{form.size}</span>}
          </div>
          {form.description && <p className="text-xs text-gray-500 line-clamp-2">{form.description}</p>}
          <p className="text-lg font-display font-semibold text-nebula-cyan">{currency}{form.price || 0}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveMenuPreview;
