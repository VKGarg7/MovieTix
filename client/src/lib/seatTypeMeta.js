import { Star, Sofa, Accessibility } from "lucide-react";

export const SEAT_TYPE_META = {
  regular: { label: "Regular", border: "border-primary/60", icon: null },
  premium: { label: "Premium", border: "border-amber-400/80", icon: Star },
  recliner: { label: "Recliner", border: "border-purple-400/80", icon: Sofa },
  accessible: { label: "Accessible", border: "border-sky-400/80", icon: Accessibility },
};

export const getSeatTypeMeta = (seatType) => SEAT_TYPE_META[seatType] || SEAT_TYPE_META.regular;
