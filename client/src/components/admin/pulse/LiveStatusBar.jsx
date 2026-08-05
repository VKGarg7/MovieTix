import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LiveStatusBar = ({ lastUpdated, intervalMs }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsAgo = lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null;

  return (
    <div className="glass-panel !rounded-2xl px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5 font-semibold text-nebula-cyan">
        <motion.span
          className="w-2 h-2 rounded-full bg-nebula-cyan"
          style={{ boxShadow: "0 0 10px 2px rgba(63,216,224,0.7)" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        🟢 LIVE
      </span>
      <span className="text-gray-500">
        Last updated {secondsAgo === null ? "—" : secondsAgo <= 1 ? "just now" : `${secondsAgo} sec ago`}
      </span>
      <span className="text-gray-600">·</span>
      <span className="text-gray-500">Refreshing every {Math.round(intervalMs / 1000)} seconds</span>
    </div>
  );
};

export default LiveStatusBar;
