import React, { useRef } from "react";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import {
  LayoutDashboardIcon,
  PlusSquareIcon,
  ListIcon,
  ListCollapseIcon,
  TicketPercentIcon,
  TrendingUpIcon,
  PopcornIcon,
  QrCodeIcon,
  BuildingIcon,
  ScrollTextIcon,
  ActivityIcon,
} from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import AdminProfileCard from "./AdminProfileCard";
import AdminTodaySummary from "./AdminTodaySummary";
import AdminSearch from "./AdminSearch";
import AdminQuickActions from "./AdminQuickActions";

const buildNavGroups = (adminRole) => [
  {
    label: "Cinema",
    items: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboardIcon },
      { name: "Add Shows", path: "/admin/add-shows", icon: PlusSquareIcon },
      { name: "List Shows", path: "/admin/list-shows", icon: ListIcon },
      { name: "List Bookings", path: "/admin/list-bookings", icon: ListCollapseIcon },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Coupons", path: "/admin/coupons", icon: TicketPercentIcon },
      { name: "Pricing Rules", path: "/admin/pricing-rules", icon: TrendingUpIcon },
      { name: "Menu Items", path: "/admin/menu-items", icon: PopcornIcon },
      { name: "Verify Pickup", path: "/admin/verify-pickup", icon: QrCodeIcon },
      { name: "Multiplex Pulse", path: "/admin/multiplex-pulse", icon: ActivityIcon },
    ],
  },
  ...(adminRole === "superAdmin"
    ? [
        {
          label: "System",
          items: [
            { name: "Manage Theaters", path: "/admin/manage-theaters", icon: BuildingIcon },
            { name: "Audit Log", path: "/admin/audit-log", icon: ScrollTextIcon },
          ],
        },
      ]
    : []),
];

const AdminSidebar = () => {
  const { adminRole } = useAppContext();
  const navGroups = buildNavGroups(adminRole);

  const rootRef = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 60, damping: 22 });
  const smy = useSpring(my, { stiffness: 60, damping: 22 });
  const spotlightBg = useTransform(
    [smx, smy],
    ([x, y]) => `radial-gradient(400px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.04), transparent 70%)`
  );

  const handlePointerMove = (e) => {
    const rect = rootRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <div
      ref={rootRef}
      onMouseMove={handlePointerMove}
      className="relative h-[calc(100vh-64px)] max-md:w-16 md:w-72 w-full shrink-0 border-r border-white/8 overflow-y-auto no-scrollbar"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0a0a10] via-void to-[#08080d]" />
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{ background: "radial-gradient(circle at 20% 0%, rgba(109,92,255,0.22), transparent 55%), radial-gradient(circle at 100% 60%, rgba(63,216,224,0.12), transparent 50%)" }}
      />
      <div className="noise-overlay absolute inset-0 -z-10" />
      <motion.div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: spotlightBg }} />

      <div className="max-md:hidden p-5 space-y-5">
        <div className="flex items-center gap-2.5">
          <img src={assets.logo} alt="MovieTix" className="w-8 h-auto shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">MovieTix</p>
            <p className="text-[10px] text-nebula-violet tracking-wide truncate">Cinema Control Center</p>
          </div>
          <span className="relative ml-auto w-2 h-2 rounded-full bg-nebula-cyan shrink-0">
            <motion.span
              className="absolute inset-0 rounded-full bg-nebula-cyan"
              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          </span>
        </div>

        <AdminProfileCard adminRole={adminRole} />

        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 px-0.5">Today's Summary</p>
          <AdminTodaySummary />
        </div>

        <AdminSearch navGroups={navGroups} />
      </div>

      <div className="px-3 md:px-5 pb-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="max-md:hidden text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 px-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((link) => (
                <NavLink key={link.path} to={link.path} end className="relative block">
                  {({ isActive }) => (
                    <motion.div
                      whileHover={{ x: isActive ? 0 : 2 }}
                      className={`relative flex items-center max-md:justify-center gap-2.5 w-full py-2.5 px-3 rounded-xl text-sm transition-colors ${
                        isActive ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="admin-nav-active"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/25 to-nebula-violet/20 border border-primary/30"
                          style={{ boxShadow: "0 0 24px -6px rgba(248,69,101,0.5)" }}
                        />
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="admin-nav-active-bar"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-primary to-nebula-violet"
                        />
                      )}
                      <link.icon className="relative w-4.5 h-4.5 shrink-0" />
                      <p className="relative max-md:hidden truncate">{link.name}</p>
                    </motion.div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-md:hidden px-5 pb-6">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 px-0.5">Quick Actions</p>
        <AdminQuickActions />
      </div>
    </div>
  );
};

export default AdminSidebar;
