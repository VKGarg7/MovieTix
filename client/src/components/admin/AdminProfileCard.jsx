import React from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { ShieldCheckIcon, Building2Icon } from "lucide-react";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 21) return "Good Evening";
  return "Good Night";
};

const ROLE_LABEL = { superAdmin: "Super Admin", theaterAdmin: "Theater Admin" };

const AdminProfileCard = ({ adminRole }) => {
  const { user } = useUser();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 overflow-hidden"
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(109,92,255,0.5), transparent 70%)" }}
      />

      <div className="relative flex items-center gap-3">
        <div className="relative shrink-0">
          <motion.div
            className="absolute -inset-1 rounded-full"
            style={{ background: "conic-gradient(from 0deg, #6D5CFF, #3FD8E0, #F84565, #FFB86B, #6D5CFF)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <img
            src={user?.imageUrl}
            alt={user?.fullName || "Admin"}
            className="relative w-11 h-11 rounded-full object-cover border-2 border-void"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-nebula-cyan border-2 border-void">
            <motion.span
              className="absolute inset-0 rounded-full bg-nebula-cyan"
              animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] text-gray-400">{getGreeting()}</p>
          <p className="text-sm font-medium truncate">{user?.fullName || user?.firstName || "Admin"}</p>
        </div>
      </div>

      <div className="relative flex items-center gap-2 mt-3.5 pt-3.5 border-t border-white/8">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-nebula-violet/15 border border-nebula-violet/30 text-nebula-violet">
          {adminRole === "superAdmin" ? <ShieldCheckIcon className="w-3 h-3" /> : <Building2Icon className="w-3 h-3" />}
          {ROLE_LABEL[adminRole] || "Admin"}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-nebula-cyan ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-nebula-cyan" /> Online
        </span>
      </div>
    </motion.div>
  );
};

export default AdminProfileCard;
