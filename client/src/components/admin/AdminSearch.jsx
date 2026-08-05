import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "lucide-react";

const AdminSearch = ({ navGroups }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const allItems = navGroups.flatMap((g) => g.items);
  const matches = query.trim()
    ? allItems.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const handleSelect = (path) => {
    navigate(path);
    setQuery("");
    setFocused(false);
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 rounded-full border bg-white/[0.04] backdrop-blur-xl px-3 py-2 transition-colors ${
          focused ? "border-nebula-violet/50" : "border-white/10"
        }`}
      >
        <SearchIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Jump to Movies, Bookings, Shows…"
          className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
        />
      </div>

      <AnimatePresence>
        {focused && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 mt-2 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden z-50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]"
          >
            {matches.map((item) => (
              <button
                key={item.path}
                onMouseDown={() => handleSelect(item.path)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <item.icon className="w-3.5 h-3.5 text-nebula-cyan" />
                {item.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSearch;
