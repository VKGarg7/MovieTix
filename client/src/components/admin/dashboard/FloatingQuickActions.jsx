import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlusIcon, XIcon, PlusSquareIcon, TicketPercentIcon, TrendingUpIcon } from "lucide-react";

const ACTIONS = [
  { label: "Add Show", icon: PlusSquareIcon, path: "/admin/add-shows" },
  { label: "Create Coupon", icon: TicketPercentIcon, path: "/admin/coupons" },
  { label: "Pricing Rules", icon: TrendingUpIcon, path: "/admin/pricing-rules" },
];

const FloatingQuickActions = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open &&
          ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigate(action.path);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 pl-4 pr-3.5 py-2.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/15 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.9)] cursor-pointer"
              >
                <span className="text-xs font-medium text-gray-200">{action.label}</span>
                <span className="w-7 h-7 rounded-full flex items-center justify-center bg-nebula-violet/15 border border-nebula-violet/30">
                  <Icon className="w-3.5 h-3.5 text-nebula-violet" />
                </span>
              </motion.button>
            );
          })}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_-15px_rgba(109,92,255,0.6)] cursor-pointer"
        style={{ background: "radial-gradient(circle at 35% 30%, rgba(109,92,255,0.9), rgba(10,10,16,0.95))" }}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <XIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
        </motion.span>
      </motion.button>
    </div>
  );
};

export default FloatingQuickActions;
