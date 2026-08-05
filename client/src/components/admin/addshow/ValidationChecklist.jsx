import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";

const ValidationChecklist = ({ selectedMovie, selectedTheater, selectedScreen, dateTimeSelection, showPrice }) => {
  const checks = useMemo(
    () => [
      { label: "Movie selected", done: Boolean(selectedMovie) },
      { label: "Theater selected", done: Boolean(selectedTheater) },
      { label: "Screen selected", done: Boolean(selectedScreen) },
      { label: "At least one screening scheduled", done: Object.keys(dateTimeSelection).length > 0 },
      { label: "Valid price entered", done: Number(showPrice) > 0 },
    ],
    [selectedMovie, selectedTheater, selectedScreen, dateTimeSelection, showPrice]
  );

  const doneCount = checks.filter((c) => c.done).length;
  const allDone = doneCount === checks.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">Publish Readiness</p>
        <span className={`text-xs font-medium ${allDone ? "text-nebula-cyan" : "text-gray-500"}`}>
          {doneCount}/{checks.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {checks.map((c) => (
          <motion.div
            key={c.label}
            animate={{ opacity: c.done ? 1 : 0.6 }}
            className="flex items-center gap-2 text-xs"
          >
            {c.done ? (
              <CheckCircle2Icon className="w-3.5 h-3.5 text-nebula-cyan shrink-0" />
            ) : (
              <CircleIcon className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            )}
            <span className={c.done ? "text-gray-300" : "text-gray-500"}>{c.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ValidationChecklist;
