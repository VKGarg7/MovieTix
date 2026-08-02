import React, { useCallback, useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import BlurCircle from "./BlurCircle";
import { useAppContext } from "../context/useAppContext";

const RecommendedSection = () => {
  const { axios, getToken, user } = useAppContext();
  const [recommendations, setRecommendations] = useState([]);

  const fetchRecommendations = useCallback(async () => {
    if (!user) {
      setRecommendations([]);
      return;
    }
    try {
      const { data } = await axios.get("/api/recommendations", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error(error);
    }
  }, [axios, getToken, user]);

  useEffect(() => {
    fetchRecommendations();
    window.addEventListener("focus", fetchRecommendations);
    return () => window.removeEventListener("focus", fetchRecommendations);
  }, [fetchRecommendations]);

  if (!user || recommendations.length === 0) return null;

  return (
    <div className="relative px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden pt-20 pb-10">
      <BlurCircle top="0" left="-80px" />
      <p className="text-gray-300 font-medium text-lg mb-8">Recommended for you</p>

      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {recommendations.map(({ movie, reason }) => (
          <div key={movie._id} className="flex flex-col gap-2">
            <MovieCard movie={movie} />
            <p className="text-xs text-gray-400 max-w-66">{reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedSection;
