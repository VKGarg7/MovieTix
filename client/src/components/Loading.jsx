import React from "react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/useAppContext";
import { playConfirm } from "../lib/soundEngine";

const MAX_POLL_ATTEMPTS = 15;

const Loading = () => {

  const {nextUrl} = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking");
  const navigate = useNavigate()
  const {axios, getToken} = useAppContext();

  useEffect(() => {
    if(!nextUrl) return;

    if(!bookingId){
      const timer = setTimeout(() => navigate('/' + nextUrl), 4000);
      return () => clearTimeout(timer);
    }

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await axios.get(`/api/booking/status/${bookingId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.isPaid || attempts >= MAX_POLL_ATTEMPTS) {
          if (data.isPaid) playConfirm();
          clearInterval(interval);
          navigate('/' + nextUrl);
        }
      } catch {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          clearInterval(interval);
          navigate('/' + nextUrl);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
    // run once on mount only — re-running would restart the poll/redirect timers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-6 h-[80vh]">
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#F84565", borderRightColor: "rgba(248,69,101,0.2)" }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#6D5CFF", borderRightColor: "rgba(109,92,255,0.15)" }}
        />
        <motion.div
          animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-5 rounded-full bg-primary blur-[6px]"
        />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="section-eyebrow"
      >
        {bookingId ? "Confirming your booking" : "Loading"}
      </motion.p>
    </div>
  );
};

export default Loading;
