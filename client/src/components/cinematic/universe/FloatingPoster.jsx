import React, { useState } from 'react'

// Remote TMDB images can be displayed by an <img>, but TMDB does not always
// grant the CORS permission required to upload them as WebGL textures. Keeping
// this as DOM content prevents a failed poster request from crashing the app.
const FloatingPoster = ({ src }) => {
  const [hovered, setHovered] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div
      className="relative w-[260px] h-[380px] md:w-[340px] md:h-[500px] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        filter: hovered
          ? 'drop-shadow(0 40px 80px rgba(248,69,101,0.35))'
          : 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))',
        transition: 'filter 0.5s ease',
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-primary/50 via-[#1a1429] to-[#060608]"
        style={{
          transform: hovered ? 'perspective(900px) rotateY(-7deg) rotateX(2deg) translateY(-8px)' : 'perspective(900px) rotateY(-2deg)',
          transition: 'transform 0.5s ease',
        }}
      >
        {!imageFailed && (
          <img
            src={src}
            alt="Featured movie poster"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
      </div>

      <div
        className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-screen"
        style={{
          opacity: hovered ? 0.55 : 0.22,
          background: 'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 48%, transparent 62%)',
          backgroundSize: '220% 220%',
          backgroundPosition: hovered ? '80% 20%' : '20% 80%',
          transition: 'background-position 0.8s ease, opacity 0.5s ease',
        }}
      />
    </div>
  )
}

export default FloatingPoster