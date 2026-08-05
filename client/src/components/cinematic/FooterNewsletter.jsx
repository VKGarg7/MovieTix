import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SendIcon, CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FooterNewsletter = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <div>
      <h2 className="section-eyebrow mb-4">Newsletter</h2>
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        First look at new releases, premieres, and exclusive screenings.
      </p>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-nebula-cyan/30 bg-nebula-cyan/10 text-nebula-cyan text-sm"
          >
            <motion.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
            >
              <CheckCircle2Icon className="w-4 h-4 shrink-0" />
            </motion.span>
            You're on the list — welcome aboard.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-2.5"
          >
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="you@example.com"
                aria-label="Email address"
                aria-invalid={!!error}
                className="glass-input pr-11 !rounded-xl"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Subscribe"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-primary/90 hover:bg-primary text-white transition-colors cursor-pointer"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </motion.button>
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-primary">
                {error}
              </motion.p>
            )}
            <p className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-relaxed pt-1">
              <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
              We respect your inbox. Unsubscribe anytime, no spam.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FooterNewsletter;
