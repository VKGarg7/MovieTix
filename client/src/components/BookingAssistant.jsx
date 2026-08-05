import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useAppContext } from "../context/useAppContext";
import {
  parseBookingQuery,
  findMatchingMovies,
  findFirstAvailableShowtime,
  summarizeParsedQuery,
} from "../lib/bookingAssistantParser";
import { dummyTrailers } from "../assets/assets";
import AIOrb from "./cinematic/AIOrb";
import VoiceButton from "./cinematic/VoiceButton";
import ConciergeMovieCard from "./cinematic/ConciergeMovieCard";
import ConciergeStepper from "./cinematic/ConciergeStepper";

const QUICK_ACTIONS = [
  { emoji: "🍿", label: "Movie Night", prompt: "Suggest a great movie for a fun night in" },
  { emoji: "❤️", label: "Date Night", prompt: "2 seats for a romantic movie tonight" },
  { emoji: "👨‍👩‍👧", label: "Family Time", prompt: "A family-friendly movie this weekend" },
  { emoji: "🔥", label: "Trending", prompt: "What's trending right now" },
  { emoji: "🎬", label: "New Releases", prompt: "Show me new releases" },
  { emoji: "⭐", label: "Top Rated", prompt: "Show me the top rated movies" },
  { emoji: "🤖", label: "Surprise Me", prompt: "Surprise me with something great" },
  { emoji: "🎟", label: "Book Fast", prompt: "2 seats for tonight, any good movie" },
];

const PLACEHOLDER_CYCLE = [
  "Describe your perfect movie night...",
  "2 seats for a comedy tonight after 8...",
  "Something thrilling near Andheri...",
  "Surprise me with a top rated film...",
];

let messageId = 0;
const nextId = () => ++messageId;

const BookingAssistant = () => {
  const navigate = useNavigate();
  const { shows, selectedTheater, fetchTheaters, fetchShowDetails, image_base_url } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [openStage, setOpenStage] = useState("closed"); // closed -> orb -> panel -> greeting -> ready
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [bookingStep, setBookingStep] = useState(null); // null until a real flow starts
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchTheaters().then(setTheaters);
  }, [fetchTheaters]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setOpenStage("closed");
      return;
    }
    setOpenStage("orb");
    const t1 = setTimeout(() => setOpenStage("panel"), 180);
    const t2 = setTimeout(() => setOpenStage("greeting"), 420);
    const t3 = setTimeout(() => setOpenStage("ready"), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  useEffect(() => {
    if (input) return;
    const t = setInterval(() => setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_CYCLE.length), 3200);
    return () => clearInterval(t);
  }, [input]);

  const addMessage = useCallback((role, content, extra = {}) => {
    setMessages((prev) => [...prev, { id: nextId(), role, content, ...extra }]);
  }, []);

  const goToSeatSelection = (movie, date, showId, seats) => {
    setBookingStep(4);
    const params = new URLSearchParams();
    if (showId) params.set("time", showId);
    if (seats) params.set("seats", seats);
    const qs = params.toString();
    navigate(`/movies/${movie._id}/${date}${qs ? `?${qs}` : ""}`);
  };

  const runQuery = async (text) => {
    addMessage("user", text);
    setIsProcessing(true);
    setBookingStep(0);

    try {
      const cities = [...new Set(theaters.map((t) => t.city))];
      const parsed = parseBookingQuery(text, { shows, theaters, cities });

      if (parsed.issues.length > 0) {
        addMessage("assistant", `I noticed a snag: ${parsed.issues.join(" ")} Could you rephrase that?`);
        setBookingStep(null);
        return;
      }

      if (parsed.confidence === 0) {
        addMessage("assistant", `I couldn't pull booking details from that, so I'm searching "${text}" for you instead.`);
        navigate(`/movies?q=${encodeURIComponent(text)}`);
        setBookingStep(null);
        return;
      }

      const matchingMovies = findMatchingMovies(parsed, shows);

      if (matchingMovies.length === 0) {
        addMessage("assistant", `No exact matches for that yet — taking you to search results for "${text}".`);
        navigate(`/movies?q=${encodeURIComponent(text)}`);
        setBookingStep(null);
        return;
      }

      setBookingStep(1);

      const candidates = matchingMovies.slice(0, 4);
      const withDetails = await Promise.all(
        candidates.map(async (movie) => {
          const details = await fetchShowDetails(movie._id, selectedTheater?._id);
          if (!details?.dateTime) return { movie, showtimes: [] };
          const flattened = Object.values(details.dateTime).flat();
          return { movie, showtimes: flattened };
        })
      );

      const summary = summarizeParsedQuery(parsed);
      addMessage(
        "assistant",
        matchingMovies.length === 1
          ? `${summary} Here's what I found.`
          : `${summary} Here are ${withDetails.length} great picks.`,
        { cards: withDetails, parsed }
      );
      setBookingStep(2);
    } catch (error) {
      console.error("Concierge error:", error);
      addMessage("assistant", "Something went wrong on my end — please try again or use the regular search.");
      setBookingStep(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isProcessing) return;
    setInput("");
    await runQuery(text);
  };

  const handleQuickAction = (prompt) => {
    setInput("");
    runQuery(prompt);
  };

  const handleBookCard = (movie, showtimes) => {
    const parsed = { timeWindow: null };
    const dateTimeMap = {};
    showtimes.forEach((s) => {
      const date = new Date(s.time).toISOString().split("T")[0];
      (dateTimeMap[date] ||= []).push(s);
    });
    const first = findFirstAvailableShowtime(dateTimeMap, parsed.timeWindow);
    if (!first) {
      navigate(`/movies/${movie._id}`);
      return;
    }
    addMessage("assistant", `Great choice — heading to seat selection for "${movie.title}".`);
    goToSeatSelection(movie, first.date, first.showtime.showId);
  };

  const showChips = openStage === "ready" && messages.length === 0;

  return (
    <>
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_-15px_rgba(109,92,255,0.6)] cursor-pointer"
        style={{ background: "radial-gradient(circle at 35% 30%, rgba(30,30,45,0.9), rgba(10,10,16,0.95))" }}
        aria-label={isOpen ? "Close AI Concierge" : "Open AI Concierge"}
      >
        {isOpen ? <XIcon className="w-5 h-5" /> : <AIOrb size={34} active />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[78vh] flex flex-col rounded-[28px] overflow-hidden border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]"
            style={{ backdropFilter: "blur(28px) saturate(150%)" }}
          >
            <div className="absolute inset-0 -z-10 bg-[#08080d]/85" />
            <div
              className="absolute inset-0 -z-10 opacity-70"
              style={{
                background:
                  "radial-gradient(circle at 15% 0%, rgba(109,92,255,0.28), transparent 55%), radial-gradient(circle at 90% 100%, rgba(63,216,224,0.22), transparent 55%)",
              }}
            />

            <div className="relative flex items-center gap-3 px-5 py-4 border-b border-white/8">
              <AIOrb size={38} active={isProcessing} />
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1.5 truncate">
                  <SparklesIcon className="w-3.5 h-3.5 text-nebula-violet shrink-0" />
                  MovieTix AI Concierge
                </p>
                <p className="text-[11px] text-gray-400 truncate">Your Personal Cinema Assistant</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {bookingStep !== null && <ConciergeStepper stepIndex={bookingStep} />}

            <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-52">
              <AnimatePresence mode="wait">
                {messages.length === 0 && openStage !== "orb" && openStage !== "panel" && (
                  <motion.div
                    key="greeting"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="text-[15px] leading-relaxed text-gray-200">
                      👋 Hey, I'm your cinema concierge. Tell me the mood, the crowd, or the exact seats you need —
                      I'll find the film and get you booked.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {showChips && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                  className="flex flex-wrap gap-2"
                >
                  {QUICK_ACTIONS.map((chip) => (
                    <motion.button
                      key={chip.label}
                      variants={{ hidden: { opacity: 0, y: 10, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
                      whileHover={{ y: -3, scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleQuickAction(chip.prompt)}
                      className="group relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-white/10 bg-white/[0.05] hover:bg-white/10 hover:border-white/25 backdrop-blur-xl transition-colors cursor-pointer overflow-hidden"
                    >
                      <span
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "radial-gradient(circle at 50% 0%, rgba(109,92,255,0.25), transparent 70%)" }}
                      />
                      <span className="relative">{chip.emoji}</span>
                      <span className="relative">{chip.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={msg.role === "user" ? "flex justify-end" : ""}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm bg-gradient-to-br from-primary to-primary-dull text-white shadow-[0_8px_24px_-8px_rgba(248,69,101,0.6)]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 mt-0.5 shrink-0">
                          <AIOrb size={24} />
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed pt-0.5">{msg.content}</p>
                      </div>

                      {msg.cards && msg.cards.length > 0 && (
                        <div className="space-y-2.5 pl-8">
                          {msg.cards.map(({ movie, showtimes }, i) => (
                            <ConciergeMovieCard
                              key={movie._id}
                              movie={movie}
                              i={i}
                              theaterName={selectedTheater?.name}
                              showtimes={showtimes}
                              trailerUrl={dummyTrailers[i % dummyTrailers.length]?.videoUrl}
                              imageBaseUrl={image_base_url}
                              onViewDetails={() => {
                                navigate(`/movies/${movie._id}`);
                                setIsOpen(false);
                              }}
                              onBook={() => handleBookCard(movie, showtimes)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-gray-400 pl-1">
                  <AIOrb size={20} active />
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 rounded-full bg-gray-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </span>
                  thinking
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative p-3 border-t border-white/8">
              <div className="relative rounded-full p-[1.5px] bg-gradient-to-r from-nebula-violet via-primary to-nebula-cyan opacity-90 focus-within:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 rounded-full bg-[#0c0c13] px-2 py-1.5">
                  <SparklesIcon className="w-4 h-4 text-nebula-violet shrink-0 ml-1.5" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={PLACEHOLDER_CYCLE[placeholderIndex]}
                    aria-label="Describe your perfect movie night"
                    className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none py-1.5"
                  />
                  <VoiceButton disabled={isProcessing} onResult={(text) => runQuery(text)} />
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    aria-label="Send message"
                  >
                    <SendIcon className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BookingAssistant;
