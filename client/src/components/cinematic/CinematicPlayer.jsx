import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  VolumeXIcon,
  MaximizeIcon,
  MinimizeIcon,
  CaptionsIcon,
  PictureInPicture2Icon,
  SettingsIcon,
  CheckIcon,
} from "lucide-react";

const QUALITIES = ["Auto", "1080p", "720p", "480p"];

const formatTime = (s) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const getVideoId = (url) => url?.split("v=")[1]?.split("&")[0];

const CinematicPlayer = ({ trailer, poster, onEnded }) => {
  const containerRef = useRef(null);
  const playerElRef = useRef(null);
  const playerRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(80);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [quality, setQuality] = useState("Auto");
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hoverGlow, setHoverGlow] = useState({ x: 50, y: 50, active: false });
  const hideTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !playerElRef.current) return;
      playerRef.current = new window.YT.Player(playerElRef.current, {
        videoId: getVideoId(trailer.videoUrl),
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          cc_load_policy: 0,
          fs: 0,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setReady(true);
            setDuration(e.target.getDuration());
            e.target.setVolume(volume);
            e.target.mute();
          },
          onStateChange: (e) => {
            if (cancelled) return;
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.ENDED) onEnded?.();
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existing = document.getElementById("yt-iframe-api");
      if (!existing) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      setReady(false);
      setPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailer.videoUrl]);

  useEffect(() => {
    const tick = () => {
      const p = playerRef.current;
      if (p?.getCurrentTime) {
        setCurrent(p.getCurrentTime());
        const d = p.getDuration();
        if (d) setDuration(d);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing]);

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      p.setVolume(volume || 60);
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };

  const handleVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(v);
    if (v === 0) {
      p.mute();
      setMuted(true);
    } else if (muted) {
      p.unMute();
      setMuted(false);
    }
  };

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    playerRef.current?.seekTo(pct * duration, true);
    setCurrent(pct * duration);
  };

  const togglePiP = async () => {
    try {
      const iframe = playerElRef.current;
      const iframeDoc = iframe?.contentWindow?.document;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      const video = iframeDoc?.querySelector?.("video");
      if (video) await video.requestPictureInPicture();
    } catch {
      // PiP unsupported for this embed context — control remains visible but inert
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const wake = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2600);
  };

  const handleMouseMove = (e) => {
    wake();
    const rect = containerRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * -6, y: (px - 0.5) * 6 });
    setHoverGlow({ x: px * 100, y: py * 100, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHoverGlow((g) => ({ ...g, active: false }));
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 800);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="relative [perspective:1400px]">
      <div
        className="absolute -inset-x-10 -top-10 -bottom-24 -z-10 blur-3xl opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(248,69,101,0.28), transparent 65%), radial-gradient(ellipse 60% 50% at 30% 70%, rgba(109,92,255,0.22), transparent 70%)",
        }}
      />

      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        style={{ transformStyle: "preserve-3d" }}
        className="group relative w-full rounded-[28px] p-[3px] [background:linear-gradient(150deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08)_30%,rgba(109,92,255,0.35)_60%,rgba(255,255,255,0.15))] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85)]"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(320px circle at ${hoverGlow.x}% ${hoverGlow.y}%, rgba(255,255,255,0.35), transparent 60%)`,
          }}
        />

        <div className="relative rounded-[25px] overflow-hidden bg-black aspect-[21/9]">
          {!ready && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-105 blur-[2px] brightness-[0.55]"
              loading="lazy"
              decoding="async"
            />
          )}

          <div ref={playerElRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background:
                "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 22%, transparent 78%, rgba(255,255,255,0.06) 100%)",
            }}
          />
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.55)]" />

          <AnimatePresence>
            {!playing && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={togglePlay}
                aria-label="Play trailer"
                className="absolute inset-0 m-auto w-20 h-20 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/25 shadow-[0_0_60px_-5px_rgba(248,69,101,0.6)]"
              >
                <PlayIcon className="w-8 h-8 translate-x-0.5 fill-white text-white" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.div
            initial={false}
            animate={{ opacity: controlsVisible || !playing ? 1 : 0, y: controlsVisible || !playing ? 0 : 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 bottom-0 px-4 md:px-6 pb-4 pt-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
          >
            <div
              ref={progressRef}
              onClick={handleSeek}
              className="group/bar relative h-1.5 rounded-full bg-white/15 cursor-pointer mb-3 backdrop-blur-md"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-nebula-amber"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `calc(${pct}% - 7px)` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 hover:scale-110 transition-all"
                >
                  {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 translate-x-0.5" />}
                </button>

                <div className="hidden sm:flex items-center gap-2 group/vol">
                  <button
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    {muted || volume === 0 ? <VolumeXIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={muted ? 0 : volume}
                    onChange={handleVolume}
                    className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-primary cursor-pointer opacity-0 group-hover/vol:opacity-100"
                    aria-label="Volume"
                  />
                </div>

                <span className="text-xs font-medium tabular-nums text-white/80 tracking-wide">
                  {formatTime(current)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={() => setCaptionsOn((v) => !v)}
                  aria-label="Toggle captions"
                  aria-pressed={captionsOn}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                    captionsOn ? "bg-primary/20 border-primary/40 text-primary" : "border-transparent hover:bg-white/10 text-white/80"
                  }`}
                >
                  <CaptionsIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePiP}
                  aria-label="Picture in picture"
                  className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center hover:bg-white/10 text-white/80 transition-colors"
                >
                  <PictureInPicture2Icon className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowQuality((v) => !v)}
                    aria-label="Quality settings"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showQuality && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute bottom-11 right-0 min-w-[110px] rounded-xl overflow-hidden bg-black/85 backdrop-blur-xl border border-white/10 shadow-2xl"
                      >
                        {QUALITIES.map((q) => (
                          <button
                            key={q}
                            onClick={() => {
                              setQuality(q);
                              setShowQuality(false);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-white/10 transition-colors"
                          >
                            {q}
                            {quality === q && <CheckIcon className="w-3.5 h-3.5 text-primary" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 transition-colors"
                >
                  {fullscreen ? <MinimizeIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div
        className="mx-auto mt-2 h-16 md:h-24 w-[92%] opacity-25 blur-md pointer-events-none [mask-image:linear-gradient(to_bottom,black,transparent)]"
        style={{
          backgroundImage: `url(${poster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scaleY(-1)",
        }}
      />
    </div>
  );
};

export default CinematicPlayer;
