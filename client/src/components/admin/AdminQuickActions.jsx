import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlusSquareIcon, TicketPercentIcon, QrCodeIcon } from "lucide-react";

const ACTIONS = [
  { label: "Add Show", icon: PlusSquareIcon, path: "/admin/add-shows" },
  { label: "Create Coupon", icon: TicketPercentIcon, path: "/admin/coupons" },
  { label: "Verify Pickup", icon: QrCodeIcon, path: "/admin/verify-pickup" },
];

const AdminQuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-2">
      {ACTIONS.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-nebula-violet/40 py-3 transition-colors cursor-pointer group"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-nebula-violet/10 border border-nebula-violet/25 group-hover:shadow-[0_0_16px_-2px_rgba(109,92,255,0.7)] transition-shadow">
              <Icon className="w-3.5 h-3.5 text-nebula-violet" />
            </span>
            <span className="text-[9px] text-gray-400 text-center leading-tight px-1">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default AdminQuickActions;
