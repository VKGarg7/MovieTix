import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus , XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const navigate = useNavigate()

  const {favoriteMovies} = useAppContext(); 

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-gradient-to-b from-black/70 via-black/30 to-transparent backdrop-blur-sm">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="" className="w-36 h-auto" />
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:h-screen max-md:w-full max-md:flex max-md:flex-col max-md:items-center max-md:justify-center z-50 flex md:flex-row items-center gap-8 min-md:px-8 py-3 min-md:rounded-full backdrop-blur-xl bg-black/90 md:bg-white/[0.06] md:border border-white/10 md:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)] transition-all duration-300 ${isOpen ? 'max-md:visible' : 'max-md:hidden'}`}>

        <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer text-gray-300 hover:text-white transition" onClick={() => setIsOpen(!isOpen)} />

        <Link className="text-sm font-medium text-gray-300 hover:text-white transition-colors" onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/">Home</Link>
        <Link className="text-sm font-medium text-gray-300 hover:text-white transition-colors" onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/movies">Movies</Link>
        <Link className="text-sm font-medium text-gray-300 hover:text-white transition-colors" onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/">Theaters</Link>
        <Link className="text-sm font-medium text-gray-300 hover:text-white transition-colors" onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/">Releases</Link>
        {favoriteMovies.length > 0 &&<Link className="text-sm font-medium text-gray-300 hover:text-white transition-colors" onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/favourite">Favourites</Link>}
      </div>

      <div className="flex items-center gap-8">
        <SearchIcon className="max-md:hidden w-5 h-5 cursor-pointer text-gray-300 hover:text-white transition-colors" />
        {
          !user ? (
            <button onClick={openSignIn } className="btn-primary px-4 py-1.5 sm:px-7 sm:py-2.5 rounded-full font-medium text-sm cursor-pointer">Login</button>
          ) : (
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15}/>} onClick={()=> navigate('/my-bookings')}/>
              </UserButton.MenuItems>
            </UserButton>
          )
        }
      </div>

      <MenuIcon className="max-md:ml-4 md:hidden w-7 h-7 cursor-pointer text-gray-200" onClick={() => setIsOpen(!isOpen)} />
    </div>
  );
};

export default Navbar;
