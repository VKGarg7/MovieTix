import { StarIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({movie}) => {
  const Navigate = useNavigate();
  const {image_base_url} = useAppContext();

  return (
    <div className="card-surface group flex flex-col justify-between p-3 rounded-2xl hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[var(--shadow-elevated)] transition-all duration-300 w-66">
      <div className="relative overflow-hidden rounded-xl">
        <img
          onClick={() => {
            Navigate(`/movies/${movie._id}`);
            scrollTo(0, 0);
          }}
          src={image_base_url + movie.backdrop_path}
          alt=""
          className="h-52 w-full object-cover object-right-bottom cursor-pointer transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      <p className="font-semibold mt-3 truncate tracking-tight">{movie.title}</p>

      <p className="text-sm text-gray-400 mt-1.5">
        {new Date(movie.release_date).getFullYear()} ·{" "}
        {movie.genres
          .slice(0, 2)
          .map((genre) => genre.name)
          .join (" | ")}{" "}
        · {timeFormat(movie.runtime)}
      </p>

      <div className="flex items-center justify-between mt-4 pb-2">
        <button
          onClick={() => {
            Navigate(`/movies/${movie._id}`);
            scrollTo(0, 0);
          }}
          className="btn-primary px-4 py-2 text-xs rounded-full font-medium cursor-pointer text-white"
        >
          Buy Tickets
        </button>

        <p className="flex items-center gap-1 text-sm text-gray-400 pr-1">
          <StarIcon className="w-4 h-4 text-primary fill-primary" />
          {movie.vote_average.toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
