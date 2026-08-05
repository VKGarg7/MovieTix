import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlayIcon } from "lucide-react";

const getVideoId = (url) => url?.split("v=")[1]?.split("&")[0];

const RelatedTrailerCard = ({ trailer, active, onSelect, i = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const timerRef = useRef(null);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (hovered) {
      timerRef.current = setTimeout(() => setHovered(false), 4200);
    } else {
      clearTimeout(timerRef.current);
      setPreviewReady(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [hovered]);

  const handleMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  };

  return (
    <motion.button
      ref={cardRef}
      onClick={() => onSelect(trailer)}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      style={{ transformStyle: "preserve-3d" }}
      className={`group relative shrink-0 w-[260px] md:w-[300px] text-left rounded-2xl overflow-hidden border backdrop-blur-xl cursor-pointer transition-colors duration-300 ${
        active ? "border-primary/60 shadow-[0_0_50px_-10px_rgba(248,69,101,0.5)]" : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-black">
        <img
          src={trailer.image}
          alt={trailer.title}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-all duration-700 ${hovered ? "opacity-0" : "opacity-100 group-hover:scale-110"}`}
        />
        {hovered && (
          <iframe
            title={`${trailer.title} preview`}
            src={`https://www.youtube.com/embed/${getVideoId(trailer.videoUrl)}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${getVideoId(
              trailer.videoUrl
            )}`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            onLoad={() => setPreviewReady(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />

        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md border border-white/10 text-white/85">
          {trailer.duration}
        </span>

        <motion.div
          animate={{ opacity: hovered ? 0 : 1, scale: hovered ? 0.7 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center">
            <PlayIcon className="w-4 h-4 translate-x-0.5 fill-white text-white" />
          </div>
        </motion.div>

        {hovered && !previewReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}
      </div>

      <div className="p-3.5 bg-white/[0.03]">
        <p className="text-sm font-medium truncate">{trailer.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{trailer.genre}</p>
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen"
        style={{ background: "linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)" }}
      />
    </motion.button>
  );
};

export default RelatedTrailerCard;
