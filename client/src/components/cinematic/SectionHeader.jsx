import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SectionHeader = ({ eyebrow, title, subtitle, actionLabel, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-end justify-between pb-10 gap-6"
    >
      <div>
        {eyebrow && <p className="section-eyebrow mb-3">{eyebrow}</p>}
        <h2 className="font-display text-4xl md:text-6xl font-medium leading-[1.05]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-lg md:text-xl font-display font-light gradient-text max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && (
        <motion.button
          whileHover={{ x: 4 }}
          onClick={onAction}
          className="group relative shrink-0 flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer pb-1"
        >
          {actionLabel}
          <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
            <ArrowRight className="w-4 h-4" />
          </motion.span>
          <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-primary to-nebula-amber scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default SectionHeader;
