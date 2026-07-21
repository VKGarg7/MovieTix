import React, { useState } from "react";
import { dummyTrailers } from "../assets/assets";
import BlurCircle from "./BlurCircle";
import { PlayCircleIcon } from "lucide-react";

const TrailersSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  const getEmbedUrl = (url) => {
    const videoId = url.split("v=")[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  };

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-white font-semibold text-2xl tracking-tight max-w-[960px]">
        Trailers
      </p>

      <div className="relative mt-8">
        <BlurCircle top="-100px" right="-100px" />
        <iframe
          width="960"
          height="540"
          src={getEmbedUrl(currentTrailer.videoUrl)}
          title="YouTube Trailer"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="mx-auto max-w-full rounded-xl shadow-[var(--shadow-elevated)] border border-white/10"
        ></iframe>
      </div>

      <div className="group grid grid-cols-4 gap-4 md:gap-8 mt-10 max-w-3xl mx-auto">
        {dummyTrailers.map((trailer) => (
          <div
            key={trailer.image}
            className="relative overflow-hidden rounded-xl border border-white/10 group-hover:not-hover:opacity-50 hover:-translate-y-1 hover:border-white/25 duration-300 transition-all max-md:h-60 md:max-h-60 cursor-pointer"
            onClick={() => setCurrentTrailer(trailer)}
          >
            <img
              src={trailer.image}
              alt="trailer"
              className="w-full h-full object-cover brightness-75"
            />
            <div className="absolute inset-0 bg-black/20" />
            <PlayCircleIcon
              strokeWidth={1.6}
              className="absolute top-1/2 left-1/2 w-8 h-8 md:w-10 md:h-10 transform -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailersSection;