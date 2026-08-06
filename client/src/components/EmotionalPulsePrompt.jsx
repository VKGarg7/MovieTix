import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import PillOptionSelector from "./PillOptionSelector";
import { useAppContext } from "../context/useAppContext";

const TAG_LABELS = {
  moved: "🥹 Moved",
  thrilled: "😃 Thrilled",
  meh: "😐 Meh",
  haunted: "😨 Haunted",
  inspired: "✨ Inspired",
  laughed: "😂 Laughed",
  bored: "🥱 Bored",
};
const EMOTIONAL_TAGS = Object.keys(TAG_LABELS);

const EmotionalPulsePrompt = ({ bookingId }) => {
  const { axios, getToken } = useAppContext();

  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`/api/emotional-pulse/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) setTag(data.pulse?.tag || null);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleSelect = async (selectedTag) => {
    setSaving(true);
    try {
      const { data } = await axios.post(
        "/api/emotional-pulse",
        { bookingId, tag: selectedTag },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setTag(selectedTag);
        toast.success("Thanks for sharing how it felt!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log your reaction");
    }
    setSaving(false);
  };

  if (loading || dismissed) return null;

  if (tag) {
    return (
      <p className="text-xs text-gray-400 mb-3">
        You felt: <span className="text-primary">{TAG_LABELS[tag]}</span>
      </p>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-gray-400">How did it make you feel?</p>
        <button
          onClick={() => setDismissed(true)}
          className="text-[11px] text-gray-500 hover:text-white cursor-pointer"
        >
          Not now
        </button>
      </div>
      <PillOptionSelector
        options={EMOTIONAL_TAGS}
        value={saving ? null : tag}
        onChange={handleSelect}
        renderLabel={(t) => TAG_LABELS[t]}
      />
    </div>
  );
};

export default EmotionalPulsePrompt;
