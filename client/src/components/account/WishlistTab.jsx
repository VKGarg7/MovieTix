import React from "react";
import { HeartIcon } from "lucide-react";
import MovieCard from "../MovieCard";
import FlyInCard from "../cinematic/FlyInCard";

const WishlistTab = ({ favoriteMovies }) => {
  if (favoriteMovies.length === 0) {
    return (
      <div className="glass-panel p-10 text-center">
        <HeartIcon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-lg font-display font-medium mb-1">No Favourites Yet</p>
        <p className="text-sm text-gray-400 font-light">Tap the heart icon on any movie to add it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6">
      {favoriteMovies.map((movie, i) => (
        <FlyInCard key={movie._id} index={i}>
          <MovieCard movie={movie} />
        </FlyInCard>
      ))}
    </div>
  );
};

export default WishlistTab;
