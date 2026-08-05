import React from "react";
import { MonitorPlayIcon, LockIcon } from "lucide-react";

const PROJECTION_OPTIONS = ["2D", "3D", "IMAX", "4DX", "Dolby"];
const AUDIO_OPTIONS = ["Standard", "Dolby Atmos", "DTS"];

const PillGroup = ({ options, value, onChange, locked }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        disabled={locked}
        onClick={() => onChange(opt)}
        className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer disabled:cursor-not-allowed ${
          value === opt
            ? "bg-primary/15 border-primary/40 text-white"
            : "border-white/10 text-gray-400 hover:bg-white/5"
        } ${locked ? "opacity-40" : ""}`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const CreateScreenCard = ({ screenName, setScreenName, projection, setProjection, audio, setAudio }) => (
  <div className="glass-panel !rounded-3xl p-5 md:p-6">
    <h2 className="font-display text-xl font-medium flex items-center gap-2">
      <MonitorPlayIcon className="w-4.5 h-4.5 text-nebula-cyan" /> New Screen
    </h2>
    <p className="text-sm text-gray-500 mt-1 mb-5">Define a screen and its projection format.</p>

    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Screen Name</label>
        <input
          value={screenName}
          onChange={(e) => setScreenName(e.target.value)}
          placeholder="Screen 1"
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">Projection <LockIcon className="w-3 h-3 text-gray-600" /></label>
        <PillGroup options={PROJECTION_OPTIONS} value={projection} onChange={setProjection} locked />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">Audio <LockIcon className="w-3 h-3 text-gray-600" /></label>
        <PillGroup options={AUDIO_OPTIONS} value={audio} onChange={setAudio} locked />
      </div>
    </div>
  </div>
);

export default CreateScreenCard;
