import React, { useMemo } from "react";
import { motion } from "framer-motion";
import MovieCarousel from "../cinematic/MovieCarousel";
import FavouriteCard from "./FavouriteCard";

const MIN_COLLECTION_SIZE = 2;

const FavouriteCollections = ({ movies, onRemove }) => {
  const recentlyAdded = useMemo(() => [...movies].reverse().slice(0, 10), [movies]);

  const genreCollections = useMemo(() => {
    const byGenre = new Map();
    movies.forEach((m) => {
      m.genres?.forEach((g) => {
        if (!byGenre.has(g.name)) byGenre.set(g.name, []);
        byGenre.get(g.name).push(m);
      });
    });
    return [...byGenre.entries()]
      .filter(([, list]) => list.length >= MIN_COLLECTION_SIZE)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 4);
  }, [movies]);

  if (movies.length === 0) return null;

  return (
    <div className="space-y-14 mb-16">
      <section>
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="section-eyebrow mb-5">
          Recently Added
        </motion.p>
        <MovieCarousel>
          {recentlyAdded.map((movie, i) => (
            <FavouriteCard key={movie._id} movie={movie} index={i} onRemove={onRemove} />
          ))}
        </MovieCarousel>
      </section>

      {genreCollections.map(([genre, list]) => (
        <section key={genre}>
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="section-eyebrow mb-5">
            {genre} Collection
          </motion.p>
          <MovieCarousel>
            {list.map((movie, i) => (
              <FavouriteCard key={movie._id} movie={movie} index={i} onRemove={onRemove} />
            ))}
          </MovieCarousel>
        </section>
      ))}
    </div>
  );
};

export default FavouriteCollections;
