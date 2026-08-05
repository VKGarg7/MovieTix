import React from "react";
import { motion } from "framer-motion";
import { MapPinIcon, ExternalLinkIcon } from "lucide-react";

const MapPreview = ({ lat, lng, address }) => {
  const hasCoords = lat !== "" && lng !== "" && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 h-40 bg-gradient-to-br from-nebula-violet/10 to-nebula-cyan/10">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {hasCoords ? (
          <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", bounce: 0.5 }}>
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary/40"
              />
              <MapPinIcon className="w-8 h-8 text-primary relative drop-shadow-[0_0_8px_rgba(248,69,101,0.8)]" fill="currentColor" />
            </div>
          </motion.div>
        ) : (
          <p className="text-xs text-gray-500">Enter coordinates to preview location</p>
        )}
      </div>

      {hasCoords && (
        <p className="absolute bottom-2 left-2.5 text-[10px] text-gray-400 font-mono bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
        </p>
      )}

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-black/50 border border-white/15 text-gray-300 hover:text-white backdrop-blur-md transition-colors"
        >
          <ExternalLinkIcon className="w-2.5 h-2.5" /> Open in Maps
        </a>
      )}
    </div>
  );
};

export default MapPreview;
