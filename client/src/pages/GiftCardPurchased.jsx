import React from "react";
import { Link } from "react-router-dom";
import { CheckCircleIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";

const GiftCardPurchased = () => (
  <div className="relative flex flex-col items-center justify-center text-center px-6 min-h-[70vh] pt-36">
    <BlurCircle top="-100px" left="-100px" />
    <CheckCircleIcon className="w-16 h-16 text-primary mb-4" />
    <h1 className="text-2xl font-display font-medium mb-2">Gift card sent!</h1>
    <p className="text-gray-400 text-sm max-w-sm mb-6">
      We've emailed your recipient their redemption code. They can use it as account credit on their next booking.
    </p>
    <Link to="/my-bookings" className="px-6 py-3 text-sm rounded-full font-medium bg-primary cursor-pointer">
      Back to My Bookings
    </Link>
  </div>
);

export default GiftCardPurchased;
