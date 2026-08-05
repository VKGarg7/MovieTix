import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2Icon } from "lucide-react";

const RecentPickupsList = ({ pickups }) => {
  if (pickups.length === 0) return null;

  return (
    <div className="glass-panel !rounded-2xl p-4">
      <p className="text-xs font-medium text-gray-300 mb-3">Recent Pickups</p>
      <div className="space-y-1.5">
        {pickups.slice(0, 10).map((p, idx) => (
          <motion.div
            key={`${p.bookingId}-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs"
          >
            <CheckCircle2Icon className="w-3.5 h-3.5 text-nebula-cyan shrink-0" />
            <span className="flex-1 truncate text-gray-200">{p.customerName}</span>
            <span className="text-gray-500 shrink-0">{p.itemCount} items</span>
            <span className="text-gray-500 shrink-0">{new Date(p.verifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentPickupsList;
