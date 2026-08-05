import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2Icon, ChevronDownIcon, SearchIcon, MapPinIcon } from "lucide-react";
import { getTheaterPresentation } from "../../../lib/theaterPresentation";

const TheaterPickerDropdown = ({ theaters, value, onChange, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const setOpenState = (next) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const selected = theaters.find((t) => t._id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return theaters;
    return theaters.filter((t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q));
  }, [theaters, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenState(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-xl transition-colors cursor-pointer text-left"
      >
        <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-nebula-violet/15 border border-nebula-violet/30 shrink-0">
          <Building2Icon className="w-4 h-4 text-nebula-violet" />
        </span>
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="text-sm font-medium truncate">{selected.name}</p>
              <p className="text-xs text-gray-400 truncate">{selected.city}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select a theater</p>
          )}
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpenState(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl z-40 overflow-hidden shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8">
                <SearchIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search theaters or cities…"
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
              </div>

              <div className="max-h-72 overflow-y-auto no-scrollbar">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-500 px-4 py-6 text-center">No theaters found.</p>
                ) : (
                  filtered.map((theater) => {
                    const { palette, amenities } = getTheaterPresentation(theater);
                    return (
                      <button
                        key={theater._id}
                        type="button"
                        onClick={() => {
                          onChange(theater._id);
                          setOpenState(false);
                          setQuery("");
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                          value === theater._id ? "bg-primary/10" : "hover:bg-white/5"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{theater.name}</p>
                          <p className="flex items-center gap-1 text-xs text-gray-400 truncate">
                            <MapPinIcon className="w-3 h-3 shrink-0" /> {theater.city}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {amenities.slice(0, 2).map((a) => (
                            <span key={a.key} className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/5 border border-white/10 text-gray-400">
                              {a.label}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TheaterPickerDropdown;
