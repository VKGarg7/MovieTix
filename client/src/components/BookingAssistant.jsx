import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircleIcon, XIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useAppContext } from "../context/useAppContext";
import {
  parseBookingQuery,
  findMatchingMovies,
  findFirstAvailableShowtime,
  summarizeParsedQuery,
} from "../lib/bookingAssistantParser";

const SUGGESTED_PROMPTS = [
  "2 seats for a comedy tonight after 8",
  "3 tickets for an action movie this evening",
  "1 seat for a thriller tomorrow night",
  "Book 4 seats for a movie near Andheri",
];

const BookingAssistant = () => {
  const navigate = useNavigate();
  const { shows, selectedTheater, fetchTheaters, fetchShowDetails } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadTheaters = async () => {
      const result = await fetchTheaters();
      setTheaters(result);
    };
    loadTheaters();
  }, [fetchTheaters]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isProcessing) return;

    setInput("");
    addMessage("user", text);
    setIsProcessing(true);

    try {
      const cities = [...new Set(theaters.map((t) => t.city))];
      const parsed = parseBookingQuery(text, {
        shows,
        theaters,
        cities,
      });

      if (parsed.issues.length > 0) {
        addMessage(
          "assistant",
          `Hmm, I noticed a problem: ${parsed.issues.join(" ")}. Could you rephrase that?`
        );
        return;
      }

      if (parsed.confidence === 0) {
        addMessage(
          "assistant",
          `I couldn't find any booking details in that. I'll search for "${text}" instead.`
        );
        navigate(`/movies?q=${encodeURIComponent(text)}`);
        return;
      }

      const matchingMovies = findMatchingMovies(parsed, shows);

      if (matchingMovies.length === 0) {
        addMessage(
          "assistant",
          `I couldn't find any movies matching that. I'll search for "${text}" instead.`
        );
        navigate(`/movies?q=${encodeURIComponent(text)}`);
        return;
      }

      if (matchingMovies.length > 1) {
        const summary = summarizeParsedQuery(parsed);
        addMessage(
          "assistant",
          `${summary} I found ${matchingMovies.length} movies — showing you the list.`
        );
        const params = new URLSearchParams();
        if (parsed.genre) params.set("genre", parsed.genre);
        if (parsed.title) params.set("q", parsed.title);
        navigate(`/movies?${params.toString()}`);
        return;
      }

      const movie = matchingMovies[0];
      addMessage("assistant", `${summarizeParsedQuery(parsed)} Let me find a showtime for you.`);

      const showDetails = await fetchShowDetails(movie._id, selectedTheater?._id);
      if (!showDetails?.dateTime) {
        addMessage(
          "assistant",
          `I found "${movie.title}" but couldn't load its showtimes. Taking you to the movie page.`
        );
        navigate(`/movies/${movie._id}`);
        return;
      }

      const firstAvailable = findFirstAvailableShowtime(showDetails.dateTime, parsed.timeWindow);
      if (!firstAvailable) {
        addMessage(
          "assistant",
          `I found "${movie.title}" but there are no available showtimes${
            parsed.timeWindow ? ` in the ${parsed.timeWindow}` : ""
          }. Taking you to the movie page to pick a different time.`
        );
        navigate(`/movies/${movie._id}`);
        return;
      }

      addMessage(
        "assistant",
        `Found "${movie.title}" on ${new Date(firstAvailable.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}. Taking you to seat selection.`
      );
      const params = new URLSearchParams();
      if (firstAvailable.showtime.showId) params.set("time", firstAvailable.showtime.showId);
      if (parsed.seats) params.set("seats", parsed.seats);
      const queryString = params.toString();
      navigate(`/movies/${movie._id}/${firstAvailable.date}${queryString ? `?${queryString}` : ""}`);
    } catch (error) {
      console.error("Booking assistant error:", error);
      addMessage(
        "assistant",
        "Something went wrong while processing that. Please try again or use the regular search."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dull transition cursor-pointer"
        aria-label={isOpen ? "Close booking assistant" : "Open booking assistant"}
      >
        {isOpen ? <XIcon className="w-6 h-6" /> : <MessageCircleIcon className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[70vh] flex flex-col rounded-2xl bg-[#1f1f24] border border-primary/20 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-b border-primary/20">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Booking Assistant</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-40">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-400 space-y-3">
                <p>
                  Tell me what you want to watch and I'll set it up. For example:
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer transition"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm max-w-[85%] px-3 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-white ml-auto"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {isProcessing && (
              <div className="text-sm bg-gray-800 text-gray-400 px-3 py-2 rounded-lg w-max">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 2 seats for a comedy tonight after 8"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer disabled:opacity-40"
              aria-label="Send message"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default BookingAssistant;