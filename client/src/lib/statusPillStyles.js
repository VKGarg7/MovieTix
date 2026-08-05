// Shared tone → class/glow mapping used by every admin status pill.
// "cls" pairs with a dot/icon/emoji + label pill; "dot" is the small pulse-dot color;
// "glow" is the box-shadow applied to the dot when the pill's tone should glow.
export const TONE_STYLES = {
  cyan: { cls: "bg-nebula-cyan/10 border-nebula-cyan/30 text-nebula-cyan", dot: "bg-nebula-cyan", glow: "0 0 12px -2px rgba(63,216,224,0.6)" },
  violet: { cls: "bg-nebula-violet/10 border-nebula-violet/30 text-nebula-violet", dot: "bg-nebula-violet", glow: "0 0 12px -2px rgba(109,92,255,0.6)" },
  amber: { cls: "bg-nebula-amber/10 border-nebula-amber/30 text-nebula-amber", dot: "bg-nebula-amber", glow: "0 0 12px -2px rgba(255,184,107,0.6)" },
  primary: { cls: "bg-primary/10 border-primary/30 text-primary", dot: "bg-primary", glow: "0 0 12px -2px rgba(248,69,101,0.6)" },
  neutral: { cls: "bg-white/5 border-white/15 text-gray-400", dot: "bg-gray-400", glow: "none" },
  neutralLight: { cls: "bg-white/5 border-white/15 text-gray-300", dot: "bg-gray-400", glow: "none" },
};

export const getToneStyle = (tone) => TONE_STYLES[tone] || TONE_STYLES.neutral;
