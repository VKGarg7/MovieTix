import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Github,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  MessageCircle,
  TicketIcon,
  BuildingIcon,
  ArrowRightIcon,
} from "lucide-react";
import { assets } from "../assets/assets";
import FooterAmbience from "./cinematic/FooterAmbience";
import StatCounter from "./cinematic/StatCounter";
import SocialButton from "./cinematic/SocialButton";
import AppBadge from "./cinematic/AppBadge";
import FooterNewsletter from "./cinematic/FooterNewsletter";
import RippleButton from "./cinematic/RippleButton";
import MagneticButton from "./cinematic/MagneticButton";

const STATS = ["50+ Cities", "120+ Theaters", "5,000+ Movies", "500K+ Tickets Booked"];

const SOCIALS = [
  { icon: Github, label: "GitHub", href: "https://github.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: MessageCircle, label: "Discord", href: "https://discord.com" },
];

const COMPANY_LINKS = ["Home", "About us", "Contact us", "Careers"];
const SUPPORT_LINKS = ["Help Center", "Privacy policy", "Terms of service", "Refund policy"];
const EXPLORE_LINKS = [
  { label: "Now Showing", to: "/movies" },
  { label: "Theaters", to: "/theaters" },
  { label: "My Bookings", to: "/my-bookings" },
  { label: "Favourites", to: "/favourite" },
];

const columnReveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative mt-56 w-full text-gray-300 overflow-hidden">
      <FooterAmbience />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="px-6 md:px-16 lg:px-24 xl:px-44">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="pt-32 pb-20 text-center max-w-3xl mx-auto"
        >
          <p className="section-eyebrow mb-5">The End Credits Roll</p>
          <h2 className="font-display text-4xl md:text-6xl font-medium leading-[1.05] mb-5">
            Ready For Your Next <span className="gradient-text">Movie Night?</span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg font-light leading-relaxed mb-10 max-w-xl mx-auto">
            Discover thousands of movies, premium theaters, and unforgettable cinematic experiences.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <RippleButton
              onClick={() => {
                navigate("/movies");
                scrollTo(0, 0);
              }}
              className="text-white px-9 py-3.5 border border-white/10 rounded-full text-sm inline-flex items-center gap-2"
            >
              <TicketIcon className="w-4 h-4" /> Explore Movies
              <ArrowRightIcon className="w-4 h-4" />
            </RippleButton>

            <MagneticButton
              as={motion.button}
              onClick={() => {
                navigate("/theaters");
                scrollTo(0, 0);
              }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm border border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-colors cursor-pointer"
            >
              <BuildingIcon className="w-4 h-4" /> Browse Theaters
            </MagneticButton>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 glass-panel px-6 md:px-10 py-8 mb-20"
        >
          {STATS.map((s, i) => (
            <StatCounter key={s} label={s} i={i} />
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 pb-16"
        >
          <motion.div variants={columnReveal} className="glass-panel p-6 lg:col-span-1">
            <img className="w-28 h-auto" src={assets.logo} alt="MovieTix logo" />
            <p className="mt-5 text-sm leading-relaxed text-gray-400 font-light">
              A cinematic booking experience — reserve your seat among the stars.
            </p>
            <div className="flex items-center gap-2.5 mt-6 flex-wrap">
              <AppBadge store="apple" />
              <AppBadge store="google" />
            </div>
          </motion.div>

          <motion.div variants={columnReveal} className="glass-panel p-6">
            <h2 className="section-eyebrow mb-5">Company</h2>
            <ul className="text-sm space-y-3 text-gray-400">
              {COMPANY_LINKS.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={columnReveal} className="glass-panel p-6">
            <h2 className="section-eyebrow mb-5">Support</h2>
            <ul className="text-sm space-y-3 text-gray-400">
              {SUPPORT_LINKS.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={columnReveal} className="glass-panel p-6">
            <h2 className="section-eyebrow mb-5">Explore</h2>
            <ul className="text-sm space-y-3 text-gray-400">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => {
                      navigate(link.to);
                      scrollTo(0, 0);
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={columnReveal} className="glass-panel p-6">
            <FooterNewsletter />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-3 pb-16"
        >
          {SOCIALS.map((s) => (
            <SocialButton key={s.label} {...s} />
          ))}
        </motion.div>
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-44">
        <motion.div
          className="h-px w-full opacity-80"
          style={{
            background: "linear-gradient(90deg, transparent, #F84565, #FFB86B, #6D5CFF, transparent)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPositionX: ["0%", "200%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-7 text-xs text-gray-500 tracking-wide text-center sm:text-left">
          <p>© {new Date().getFullYear()} MovieTix — All Rights Reserved.</p>
          <p>Built with React, FastAPI, Three.js, Framer Motion, Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
