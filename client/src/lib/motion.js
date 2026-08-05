export const EASE_CINEMATIC = [0.16, 1, 0.3, 1];

export const FADE_UP = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE_CINEMATIC },
};

export const SPRING_PILL = { type: "spring", stiffness: 350, damping: 24 };
export const SPRING_SNAPPY = { type: "spring", stiffness: 400, damping: 25 };
export const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 26 };
