import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const AdminNavbar = () => {
  return (
    <div className="relative flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/8 bg-void/80 backdrop-blur-xl z-10">
      <Link to="/">
        <img src={assets.logo} alt="" className="w-36 h-auto drop-shadow-[0_0_20px_rgba(248,69,101,0.35)]" />
      </Link>
    </div>
  );
};

export default AdminNavbar;
