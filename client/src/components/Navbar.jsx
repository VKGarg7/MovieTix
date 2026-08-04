import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, Users, Clock, XIcon, MapPinIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/useAppContext";

const Navbar = ({ onChangeLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const navigate = useNavigate()

  const {favoriteMovies, selectedCity, selectedTheater, getPendingReferralCode} = useAppContext();

  const handleLogin = () => {
    const referralCode = getPendingReferralCode();
    openSignIn(referralCode ? { unsafeMetadata: { referralCode } } : undefined);
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="" className="w-36 h-auto" />
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:h-screen max-md:w-full max-md:flex max-md:flex-col max-md:items-center max-md:justify-center z-50 flex md:flex-row items-center gap-8 min-md:px-8 py-3 min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 transition-all duration-300 ${isOpen ? 'max-md:visible' : 'max-md:hidden'}`}>

        <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />

        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/">Home</Link>
        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/movies">Movies</Link>
        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/theaters">Theaters</Link>
        {favoriteMovies.length > 0 &&<Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/favourite">Favourites</Link>}
      </div>

      <div className="flex items-center gap-8">
        <button
          onClick={onChangeLocation}
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white cursor-pointer max-w-40 truncate"
          title="Change city/theater"
        >
          <MapPinIcon className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {selectedTheater ? selectedTheater.name : selectedCity || "Select city"}
          </span>
        </button>

        <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer" />
        {
          !user ? (
            <button onClick={handleLogin} className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer">Login</button>
          ) : (
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15}/>} onClick={()=> navigate('/my-bookings')}/>
                <UserButton.Action label="My Watch Parties" labelIcon={<Users width={15}/>} onClick={()=> navigate('/my-bookings#watch-parties')}/>
                <UserButton.Action label="My Waitlist" labelIcon={<Clock width={15}/>} onClick={()=> navigate('/my-bookings#waitlist')}/>
              </UserButton.MenuItems>    
            </UserButton>
          )
        }
      </div>
 
      <MenuIcon className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
    </div>
  );
};

export default Navbar;
