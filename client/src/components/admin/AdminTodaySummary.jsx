import React, { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { useRef } from "react";
import { TicketIcon, BanknoteIcon, FilmIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { prefersReducedMotion } from "../../lib/prefersReducedMotion";

const CountUp = ({ value, prefix = "", i = 0 }) => {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1,
      delay: 0.1 + i * 0.08,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
    </span>
  );
};

const AdminTodaySummary = () => {
  const { axios, getToken } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: res } = await axios.get("/api/admin/dashboard-data", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!cancelled && res.success) setData(res.dashboardData);
      } catch (error) {
        console.error("Failed to load today's summary:", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [axios, getToken]);

  const stats = [
    { icon: TicketIcon, label: "Bookings Today", value: data?.todayBookings ?? 0, prefix: "" },
    { icon: BanknoteIcon, label: "Revenue Today", value: data?.todayRevenue ?? 0, prefix: currency },
    { icon: FilmIcon, label: "Running Shows", value: data?.activeShowsCount ?? 0, prefix: "" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
          >
            <Icon className="w-3.5 h-3.5 text-nebula-cyan mb-1.5" />
            <p className="text-sm font-medium tabular-nums leading-tight">
              <CountUp value={s.value} prefix={s.prefix} i={i} />
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{s.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AdminTodaySummary;
