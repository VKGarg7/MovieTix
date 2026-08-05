import React, { useEffect, useState } from "react";
import SectionHeader from "../cinematic/SectionHeader";
import AIBadge from "../cinematic/AIBadge";
import RecommendationCard from "../cinematic/RecommendationCard";
import { useAppContext } from "../../context/useAppContext";

const BecauseYouLoved = () => {
  const { axios, getToken, user } = useAppContext();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await axios.get("/api/recommendations", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!cancelled && data.success) setRecommendations(data.recommendations);
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, axios, getToken]);

  if (!user || recommendations.length === 0) return null;

  return (
    <div className="mb-16">
      <div className="mb-6">
        <AIBadge label="Because You Loved... · AI Curated" />
      </div>
      <SectionHeader
        eyebrow="For You"
        title="More Like Your Favorites"
        subtitle="Matched to the taste your collection reveals"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {recommendations.slice(0, 4).map((rec, i) => (
          <RecommendationCard key={rec.movie._id} movie={rec.movie} reason={rec.reason} matchPercent={rec.matchPercent} index={i} />
        ))}
      </div>
    </div>
  );
};

export default BecauseYouLoved;
