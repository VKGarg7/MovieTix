import React from "react";
import { motion } from "framer-motion";
import { useClerk } from "@clerk/clerk-react";
import {
  LayoutDashboardIcon,
  TicketIcon,
  HeartIcon,
  GiftIcon,
  ShieldIcon,
  LogOutIcon,
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboardIcon },
  { key: "bookings", label: "Bookings", icon: TicketIcon },
  { key: "wishlist", label: "Wishlist", icon: HeartIcon },
  { key: "rewards", label: "Rewards", icon: GiftIcon },
  { key: "security", label: "Security", icon: ShieldIcon },
];


const AccountSidebar = ({ active, onChange }) => {
  const { signOut } = useClerk();

  return (
    <div className="glass-panel p-3 flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar lg:sticky lg:top-28 lg:w-56 shrink-0">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm shrink-0 transition-colors cursor-pointer ${
              isActive ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="account-sidebar-active"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/25 to-nebula-violet/20 border border-primary/30"
                style={{ boxShadow: "0 0 24px -6px rgba(248,69,101,0.5)" }}
              />
            )}
            <Icon className="relative w-4 h-4 shrink-0" />
            <span className="relative whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}

      <div className="hidden lg:block h-px bg-white/10 my-1.5" />

      <button
        onClick={() => signOut()}
        className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm shrink-0 text-primary/90 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <LogOutIcon className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">Logout</span>
      </button>
    </div>
  );
};

export default AccountSidebar;
