import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicIcon, MicOffIcon } from "lucide-react";

const SpeechRecognitionCtor =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const WAVE_BARS = Array.from({ length: 5 }, (_, i) => i);

const VoiceButton = ({ onResult, disabled }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SpeechRecognitionCtor) return null;

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={disabled}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      aria-pressed={listening}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
        listening
          ? "border-primary/60 bg-primary/20 text-primary"
          : "border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-white/25"
      } disabled:opacity-40 disabled:pointer-events-none`}
    >
      <AnimatePresence>
        {listening && (
          <motion.span
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-primary/40"
          />
        )}
      </AnimatePresence>

      {listening ? (
        <span className="flex items-end gap-[2px] h-3.5 relative">
          {WAVE_BARS.map((i) => (
            <motion.span
              key={i}
              className="w-[2.5px] rounded-full bg-primary"
              animate={{ height: ["25%", "100%", "40%", "80%", "25%"] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
            />
          ))}
        </span>
      ) : (
        <MicIcon className="w-4 h-4 relative" />
      )}
    </motion.button>
  );
};

export const VoiceUnsupported = () => (
  <div className="w-9 h-9 rounded-full flex items-center justify-center border border-white/5 text-gray-600 shrink-0" title="Voice input not supported in this browser">
    <MicOffIcon className="w-4 h-4" />
  </div>
);

export default VoiceButton;
