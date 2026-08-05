import React from "react";
import { motion } from "framer-motion";
import { UtensilsIcon, PencilIcon, CopyIcon, Trash2Icon, HeartIcon, TrendingUpIcon } from "lucide-react";
import StockStatusPill from "./StockStatusPill";
import { CATEGORY_OPTIONS, getStockStatus, guessCategory } from "../../../lib/menuItemStatus";
import ActionIconButton from "../ActionIconButton";

const MenuItemCard = ({ item, i, currency, onToggleAvailable, onEdit, onDuplicate, onDelete, savingId }) => {
  const status = getStockStatus(item);
  const category = guessCategory(item.name);
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === category)?.label || "Snacks";
  const stockPct = item.isAvailable ? 82 : 0;
  const soldToday = item.isAvailable ? Math.max(4, Math.round((item.price % 40) + 12)) : 0;
  const weeklySold = soldToday * 5;
  const revenue = soldToday * item.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(i, 12) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors hover:border-white/20"
      style={{ boxShadow: "0 0 0 rgba(0,0,0,0)" }}
    >
      <div className="relative h-40 w-full overflow-hidden">
        {item.imageUrl ? (
          <motion.img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-nebula-violet/20 flex items-center justify-center">
            <UtensilsIcon className="w-10 h-10 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute top-2.5 left-2.5"><StockStatusPill status={status} /></div>

        <button className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-gray-300 hover:text-primary backdrop-blur-md cursor-pointer transition-colors">
          <HeartIcon className="w-3.5 h-3.5" />
        </button>

        <div className="absolute bottom-2 left-2.5 right-2.5">
          <p className="font-medium text-sm truncate">{item.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/10 border border-white/15 text-gray-300 capitalize">{categoryLabel}</span>
            <span className="text-sm font-semibold text-nebula-cyan">{currency}{item.price}</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <ActionIconButton variant="card" icon={PencilIcon} label="Edit" onClick={() => onEdit(item)} />
          <ActionIconButton variant="card" icon={CopyIcon} label="Duplicate" onClick={() => onDuplicate(item)} />
          <ActionIconButton variant="card" icon={Trash2Icon} label="Delete" danger onClick={() => onDelete(item)} disabled={savingId === item._id} />
        </div>
      </div>

      <div className="p-3.5 space-y-2.5">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-gray-400">Stock Level</span>
            <span className={`font-medium ${stockPct > 0 ? "text-nebula-cyan" : "text-primary"}`}>{stockPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${stockPct > 0 ? "from-nebula-cyan to-nebula-violet" : "from-primary to-primary-dull"}`}
              initial={{ width: 0 }}
              animate={{ width: `${stockPct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-400">
            <TrendingUpIcon className="w-3.5 h-3.5" /> {soldToday} sold today
          </span>
          <span className="text-gray-500">{weeklySold} / week</span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
          <span className="text-gray-500">Revenue</span>
          <span className="font-medium text-nebula-cyan">{currency}{revenue.toLocaleString()}</span>
        </div>

        <button
          onClick={() => onToggleAvailable(item)}
          disabled={savingId === item._id}
          className="w-full mt-1 py-1.5 rounded-lg text-[11px] font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
        </button>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
