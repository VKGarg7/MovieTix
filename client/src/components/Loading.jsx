import React from "react";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const MAX_POLL_ATTEMPTS = 15; // ~30 seconds

const Loading = () => {

  const {nextUrl} = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking");
  const navigate = useNavigate()
  const {axios, getToken} = useAppContext();

  useEffect(() => {
    if(!nextUrl) return;

    // no booking to wait for -> short delay, then continue
    if(!bookingId){
      const timer = setTimeout(() => navigate('/' + nextUrl), 4000);
      return () => clearTimeout(timer);
    }

    // poll the booking status until the Stripe webhook confirms payment
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await axios.get(`/api/booking/status/${bookingId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.isPaid || attempts >= MAX_POLL_ATTEMPTS) {
          clearInterval(interval);
          navigate('/' + nextUrl);
        }
      } catch (error) {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          clearInterval(interval);
          navigate('/' + nextUrl);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [])

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="animate-spin rounded-full h-14 w-14 border-2 border-t-primary"></div>
    </div>
  );
};

export default Loading;
