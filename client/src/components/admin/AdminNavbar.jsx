import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const AdminNavbar = () => {
  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/10 bg-[var(--color-surface)]/60 backdrop-blur-xl">
      <Link to="/">
        <img src={assets.logo} alt="" className="w-32 h-auto opacity-90 hover:opacity-100 transition"/>
      </Link>
    </div>
  );
};

export default AdminNavbar;
