import React from "react";
import { motion } from "framer-motion";
import { CheckIcon, ScanLineIcon } from "lucide-react";

const SuccessScreen = ({ customerName, onScanNext }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="glass-panel !rounded-3xl h-full flex flex-col items-center justify-center text-center py-16 px-6 relative overflow-hidden"
  >
    <motion.div
      className="absolute inset-0 bg-nebula-cyan/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.5, 0] }}
      transition={{ duration: 1 }}
    />

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
      className="relative mb-5"
    >
      <motion.div
        animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
        transition={{ duration: 1, repeat: 2 }}
        className="absolute inset-0 rounded-full bg-nebula-cyan/40"
      />
      <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-nebula-cyan to-nebula-violet shadow-[0_0_40px_-4px_rgba(63,216,224,0.7)]">
        <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <CheckIcon className="w-12 h-12 text-black" strokeWidth={3} />
        </motion.div>
      </div>
    </motion.div>

    <h3 className="font-display text-2xl font-medium mb-1 relative">✓ Pickup Verified</h3>
    <p className="text-sm text-gray-400 relative mb-6">
      {customerName ? `${customerName} has` : "Customer has"} collected the order.
    </p>

    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onScanNext}
      className="relative btn-glow flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-white cursor-pointer"
    >
      <ScanLineIcon className="w-4 h-4" /> Scan Next Customer
    </motion.button>
  </motion.div>
);

export default SuccessScreen;
