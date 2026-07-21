import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFomat";
import { useAppContext } from "../context/AppContext";
import { Link } from "react-router-dom";

const MyBookings = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const getMyBookings = async () => {
      try {
        const { data } = await axios.get("/api/user/bookings", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) {
          setBookings(data.bookings);
        }
      } catch (error) {
        console.log(error);
      }
      setIsLoading(false);
    };

    getMyBookings();
  }, [user, axios, getToken]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />

      <div>
        <BlurCircle bottom="0px" right="600px" />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight mb-6">My Bookings</h1>

      {bookings.map((item, index) => (
        <div
          key={index}
          className="card-surface flex flex-col md:flex-row justify-between rounded-2xl mt-4 p-3 max-w-3xl hover:border-white/20 transition-colors duration-300"
        >
          {/* Displaying booking details */}
          <div className="flex flex-col md:flex-row">
            <img
              src={image_base_url + item.show.movie.poster_path}
              alt=""
              className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded-lg"
            />

            <div className="flex flex-col p-4">
              <p className="text-lg font-semibold tracking-tight">{item.show.movie.title}</p>
              <p className="text-gray-400 text-sm mt-1">
                {timeFormat(item.show.movie.runtime)}
              </p>
              <p className="text-gray-400 text-sm mt-auto">
                {dateFormat(item.show.showDateTime)}
              </p>
            </div>
          </div>

          {/* Displaying booking summary */}
          <div className="flex flex-col md:items-end md:text-right justify-between p-4">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-semibold mb-2">
                {currency}
                {item.amount}
              </p>
              {!item.isPaid &&
                <a
                  href={item.paymentLink}
                  className="btn-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer text-white"
                >
                  Pay Now
                </a>
              }
            </div>

            <div className="text-sm space-y-0.5">
              <p>
                <span className="text-gray-500">Total Tickets: </span>
                {item.bookedSeats.length}
              </p>
              <p>
                <span className="text-gray-500">Seat Number: </span>
                {item.bookedSeats.join(", ")}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
