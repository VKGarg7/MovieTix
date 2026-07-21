import React from "react";
import { assets } from "../assets/assets";
import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {

    const navigate = useNavigate()

  return (
    <div className='relative flex flex-col items-start justify-center gap-5 px-6 md:px-16 lg:px-36 bg-[url("/backgroundImage.png")] bg-cover bg-center h-screen'>
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-base)] via-transparent to-black/40" />

      <img src={assets.marvelLogo} alt="" className="relative max-h-11 lg:h-11 mt-20" />
      <h1 className="relative text-5xl md:text-[72px] md:leading-[1.05] font-semibold max-w-140 tracking-tight text-balance">
        Guardians <br /> of the Galaxy
      </h1>

      <div className="relative flex items-center gap-4 text-gray-300 text-sm">
        <span>Action | Adventure | Sci-Fi</span>
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4.5 h-4.5" /> 2025
        </div>

        <div className="flex items-center gap-1.5">
          <ClockIcon className="w-4.5 h-4.5" /> 2h 30m
        </div>
      </div>
      <p className="relative max-w-md text-gray-300 leading-relaxed">
        In a post-apocalyptic world where cities ride on wheels and consume each
        other to survive, two people meet in London and try to stop a
        conspiracy.
      </p>

      <button onClick={()=> navigate('/movies')} className="btn-primary relative flex items-center gap-2 px-7 py-3.5 text-sm rounded-full font-medium cursor-pointer text-white mt-2">
        Explore Movies
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default HeroSection;
