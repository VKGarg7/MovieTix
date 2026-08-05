import React, { createContext, useContext, useEffect, useState } from "react";
import { setMuted, startHum, stopHum, unlockAudio, playClick, playSeatSelect, playConfirm } from "../lib/soundEngine";

const SOUND_KEY = "movietix_sound_enabled";
const SoundContext = createContext(null);

export const SoundProvider = ({ children }) => {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(SOUND_KEY) === "true");

  useEffect(() => {
    setMuted(!enabled);
    localStorage.setItem(SOUND_KEY, String(enabled));
    if (enabled) {
      unlockAudio();
      startHum();
    } else {
      stopHum();
    }
  }, [enabled]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const toggle = () => setEnabled((v) => !v);

  return (
    <SoundContext.Provider value={{ enabled, toggle, playClick, playSeatSelect, playConfirm }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
};
