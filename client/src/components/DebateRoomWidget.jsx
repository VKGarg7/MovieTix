import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { MessagesSquareIcon, SendIcon } from "lucide-react";
import { useAppContext } from "../context/useAppContext";
import usePolling from "../hooks/usePolling";

const POLL_INTERVAL_MS = 8000;

const DebateRoomWidget = ({ showId }) => {
  const { axios, getToken } = useAppContext();

  const [room, setRoom] = useState(null);
  const [notEligible, setNotEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const listRef = useRef(null);

  usePolling(async (isCancelled) => {
    try {
      const { data } = await axios.get(`/api/debate-room/${showId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!isCancelled() && data.success) setRoom(data);
    } catch (error) {
      if (!isCancelled() && error.response?.status === 403) {
        setNotEligible(true);
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, POLL_INTERVAL_MS, { enabled: !notEligible, deps: [showId, axios] });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [room?.messages?.length]);

  const postMessage = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const { data } = await axios.post(
        `/api/debate-room/${showId}/messages`,
        { text: text.trim() },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setRoom(data);
        setText("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post message");
    }
    setPosting(false);
  };

  if (loading || notEligible || !room) return null;

  const isActive = room.status === "active";

  return (
    <div className="mb-3 max-w-sm w-full">
      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
        <MessagesSquareIcon className="w-3.5 h-3.5" />
        Post-show debate room {!isActive && "(closed)"}
      </p>

      <div
        ref={listRef}
        className="flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-white/10 rounded-lg p-2 bg-white/[0.02]"
      >
        {room.messages.length === 0 ? (
          <p className="text-[11px] text-gray-500 px-1 py-2">
            No messages yet — be the first to start the conversation.
          </p>
        ) : (
          room.messages.map((m) => (
            <div key={m._id} className="flex items-start gap-2 px-1 py-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/60 to-nebula-violet/60 flex items-center justify-center text-[9px] font-semibold shrink-0">
                {(m.name || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">{m.name}</p>
                <p className="text-xs text-gray-200 break-words">{m.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isActive && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && postMessage()}
            placeholder="Share your thoughts..."
            className="flex-1 bg-primary/10 border border-primary/30 rounded px-2.5 py-1.5 text-xs outline-none"
          />
          <button
            onClick={postMessage}
            disabled={posting || !text.trim()}
            className="p-1.5 bg-primary rounded cursor-pointer disabled:opacity-50"
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DebateRoomWidget;
