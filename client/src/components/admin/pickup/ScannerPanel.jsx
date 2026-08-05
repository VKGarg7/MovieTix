import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CameraIcon, CameraOffIcon, ClipboardPasteIcon, XIcon, ScanLineIcon } from "lucide-react";
import { SCANNER_ELEMENT_ID } from "../../../lib/pickupScanner";

const CORNER_POSITIONS = [
  "top-3 left-3 border-t-2 border-l-2 rounded-tl-xl",
  "top-3 right-3 border-t-2 border-r-2 rounded-tr-xl",
  "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-xl",
  "bottom-3 right-3 border-b-2 border-r-2 rounded-br-xl",
];

const ScannerPanel = ({ scanning, detected, onStart, onStop, tokenInput, setTokenInput, onSubmit, onPaste, onClear, verifying }) => (
  <div className="glass-panel !rounded-3xl p-5 space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="font-display text-lg font-medium flex items-center gap-2">
        <ScanLineIcon className="w-4 h-4 text-nebula-violet" /> Live Camera Scanner
      </h2>
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
        scanning ? "bg-nebula-cyan/10 border-nebula-cyan/30 text-nebula-cyan" : "bg-white/5 border-white/15 text-gray-400"
      }`}>
        <motion.span
          className={`w-1.5 h-1.5 rounded-full ${scanning ? "bg-nebula-cyan" : "bg-gray-500"}`}
          animate={scanning ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
        {scanning ? "Live" : "Idle"}
      </span>
    </div>

    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square max-h-[380px] mx-auto">
      <div id={SCANNER_ELEMENT_ID} className={`w-full h-full ${scanning ? "" : "hidden"}`} />

      {!scanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
          <CameraOffIcon className="w-10 h-10" />
          <p className="text-xs">Camera is off</p>
        </div>
      )}

      {scanning && (
        <>
          {CORNER_POSITIONS.map((cls) => (
            <motion.div
              key={cls}
              className={`absolute w-8 h-8 ${cls} ${detected ? "border-nebula-cyan" : "border-primary/70"}`}
              animate={detected ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.6, repeat: detected ? Infinity : 0 }}
            />
          ))}

          <AnimatePresence>
            {!detected && (
              <motion.div
                initial={{ y: "10%" }}
                animate={{ y: "90%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_2px_rgba(248,69,101,0.7)]"
              />
            )}
          </AnimatePresence>

          {detected && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-nebula-cyan/10 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute w-24 h-24 rounded-full bg-nebula-cyan/30"
              />
            </motion.div>
          )}

          <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-gray-300 bg-black/40 backdrop-blur-sm py-1.5 mx-3 rounded-full">
            Position QR code inside the frame
          </p>
        </>
      )}
    </div>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={scanning ? onStop : onStart}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
        scanning ? "border border-primary/40 text-primary hover:bg-primary/10" : "btn-glow bg-primary text-white"
      }`}
    >
      {scanning ? <CameraOffIcon className="w-4 h-4" /> : <CameraIcon className="w-4 h-4" />}
      {scanning ? "Stop Camera" : "Start Camera Scan"}
    </motion.button>

    <div className="h-px bg-white/10" />

    <form onSubmit={onSubmit} className="space-y-2">
      <label className="text-xs text-gray-400">Manual Entry</label>
      <div className="relative">
        <input
          type="text"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Enter Pickup Code"
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary/40"
        />
        {tokenInput && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={verifying}
          className="flex-1 py-2 rounded-lg text-xs font-medium bg-primary text-white disabled:opacity-50 cursor-pointer"
        >
          {verifying ? "Checking…" : "Add"}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPaste}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-white/10 text-gray-300 hover:bg-white/5 cursor-pointer"
        >
          <ClipboardPasteIcon className="w-3.5 h-3.5" /> Paste
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClear}
          className="px-3 py-2 rounded-lg text-xs border border-white/10 text-gray-300 hover:bg-white/5 cursor-pointer"
        >
          Clear
        </motion.button>
      </div>
    </form>
  </div>
);

export default ScannerPanel;
