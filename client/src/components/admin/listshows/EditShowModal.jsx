import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "lucide-react";

const EditShowModal = ({ show, dateTime, setDateTime, price, setPrice, onSave, onClose, saving }) => (
  <AnimatePresence>
    {show && (
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
          className="glass-panel !rounded-2xl w-full max-w-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-medium">Edit Show</h3>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer">
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-300 mb-3">{show.movie?.title}</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Show Date & Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Show Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSave}
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary text-white disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-white/15 text-gray-300 hover:bg-white/5 cursor-pointer">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default EditShowModal;
