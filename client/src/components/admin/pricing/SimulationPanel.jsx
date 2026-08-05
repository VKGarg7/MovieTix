import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConicalIcon, XIcon } from "lucide-react";
import Select from "../Select";

const PREMIUM_SEAT_SURCHARGE = 80;
const HIGH_OCCUPANCY_BONUS = 15;

const ruleMatches = (rule, dateTime) => {
  if (!rule.isActive) return false;
  if (rule.type === "time_of_week") {
    const hour = dateTime.getHours();
    const weekday = dateTime.getDay();
    return (rule.daysOfWeek || []).includes(weekday) && hour >= rule.startHour && hour < rule.endHour;
  }
  return false;
};

const SimulationPanel = ({ open, onClose, rules, theaters, currency }) => {
  const [basePrice, setBasePrice] = useState(250);
  const [theaterId, setTheaterId] = useState("");
  const [seatType, setSeatType] = useState("standard");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("19:00");
  const [occupancy, setOccupancy] = useState(60);

  const result = useMemo(() => {
    const dt = new Date(`${date}T${time}`);
    const applicable = rules.filter((r) => {
      const scoped = !r.theaterId || r.theaterId === theaterId;
      return scoped && ruleMatches(r, dt);
    });

    let price = Number(basePrice) || 0;
    const applied = [];

    applicable.forEach((r) => {
      const delta = price * (r.adjustmentPercent / 100);
      price += delta;
      applied.push({ label: r.name, amount: `${r.adjustmentPercent >= 0 ? "+" : ""}${r.adjustmentPercent}%` });
    });

    if (seatType === "premium") {
      price += PREMIUM_SEAT_SURCHARGE;
      applied.push({ label: "Premium Seat", amount: `+${currency}${PREMIUM_SEAT_SURCHARGE}` });
    }

    if (Number(occupancy) >= 85) {
      const bonus = price * (HIGH_OCCUPANCY_BONUS / 100);
      price += bonus;
      applied.push({ label: "High Occupancy", amount: `+${HIGH_OCCUPANCY_BONUS}%` });
    }

    return { basePrice: Number(basePrice) || 0, applied, final: Math.round(price) };
  }, [rules, basePrice, theaterId, seatType, date, time, occupancy, currency]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel !rounded-3xl w-full max-w-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-medium flex items-center gap-2">
                  <FlaskConicalIcon className="w-4 h-4 text-nebula-violet" /> Pricing Simulator
                </h3>
                <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Base Price ({currency})</label>
                  <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Theater</label>
                  <Select value={theaterId} onChange={(e) => setTheaterId(e.target.value)} options={[{ value: "", label: "Any Theater" }, ...theaters.map((t) => ({ value: t._id, label: t.name }))]} className="!w-full !py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Seat Type</label>
                  <Select value={seatType} onChange={(e) => setSeatType(e.target.value)} options={[{ value: "standard", label: "Standard" }, { value: "premium", label: "Premium" }]} className="!w-full !py-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Time</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Occupancy ({occupancy}%)</label>
                  <input type="range" min="0" max="100" value={occupancy} onChange={(e) => setOccupancy(e.target.value)} className="w-full accent-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col">
              <p className="text-xs text-gray-500 mb-3">Simulation Result</p>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Base Price</span>
                <span className="font-medium text-gray-200">{currency}{result.basePrice}</span>
              </div>

              <div className="flex-1 space-y-1.5 mt-1">
                {result.applied.length === 0 ? (
                  <p className="text-xs text-gray-500">No rules apply to this scenario.</p>
                ) : (
                  result.applied.map((a, idx) => (
                    <motion.div
                      key={`${a.label}-${idx}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-400">{a.label}</span>
                      <span className="font-medium text-nebula-amber">{a.amount}</span>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="h-px bg-white/10 my-3" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Final Price</span>
                <motion.span
                  key={result.final}
                  initial={{ scale: 1.15, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  className="text-xl font-display font-semibold bg-gradient-to-r from-primary via-nebula-magenta to-nebula-violet bg-clip-text text-transparent"
                >
                  {currency}{result.final.toLocaleString()}
                </motion.span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SimulationPanel;
