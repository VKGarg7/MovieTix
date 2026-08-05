import React, { useCallback, useEffect, useState } from "react";
import SectionHeader from "./cinematic/SectionHeader";
import AIBadge from "./cinematic/AIBadge";
import RecommendationCard from "./cinematic/RecommendationCard";
import FeaturedRecommendation from "./cinematic/FeaturedRecommendation";
import { useAppContext } from "../context/useAppContext";

const FEATURED_EVERY = 3;

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
    <div className="relative px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden pt-40 pb-16">
      <div className="mb-6">
        <AIBadge />
      </div>
      <SectionHeader
        eyebrow="Curated For You"
        title="Recommended"
        subtitle="AI Curated Picks Based On Your Taste"
      />
      <p className="text-sm text-gray-400 font-light -mt-4 mb-12 max-w-lg">
        Ranked from your booking and follow history — the closer the genre overlap, the higher the match.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {recommendations.map((rec, i) => (
          <React.Fragment key={rec.movie._id}>
            {i > 0 && i % FEATURED_EVERY === 0 && (
              <FeaturedRecommendation movie={rec.movie} reason={rec.reason} matchPercent={rec.matchPercent} />
            )}
            <RecommendationCard movie={rec.movie} reason={rec.reason} matchPercent={rec.matchPercent} index={i} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default RecommendedSection;
