import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Star, Calendar } from "lucide-react";
import FavoriteButton from "./FavoriteButton";

const MovieCard = ({
  movie,
  isFavorited,
  onFavorite,
  onUnfavorite,
  onMovieClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Check if poster_url is already a full URL (http/https), if so use directly, otherwise prepend TMDB path
  const posterUrl = movie.poster_url
    ? movie.poster_url.startsWith("http")
      ? movie.poster_url
      : `https://image.tmdb.org/t/p/w500${movie.poster_url}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "TBA";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -100px 0px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300 cursor-pointer"
    >
      {/* Poster Container */}
      <div
        onClick={() => onMovieClick?.(movie.id)}
        className="relative overflow-hidden aspect-[3/4.5] bg-slate-950 cursor-pointer"
      >
        <motion.img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.4 }}
        />

        {/* Gradient Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"
        />

        {/* Rating Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg"
        >
          <Star className="w-4 h-4 fill-current" />
          {movie.vote_average.toFixed(1)}
        </motion.div>

        {/* Hover Action - Favorite Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-3 right-3"
        >
          <FavoriteButton
            movieId={movie.id}
            isFavorited={isFavorited}
            onFavorite={onFavorite}
            onUnfavorite={onUnfavorite}
          />
        </motion.div>
      </div>

      {/* Info Section */}
      <motion.div
        className="p-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-primary-400 transition-colors line-clamp-2">
          {movie.title}
        </h3>

        {/* Year */}
        <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{year}</span>
        </div>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-3">
            {movie.genres.slice(0, 2).map((genre, idx) => (
              <span
                key={idx}
                className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded-full border border-slate-600/50 hover:border-primary-400/50 transition-colors"
              >
                {genre}
              </span>
            ))}
            {movie.genres.length > 2 && (
              <span className="text-xs text-slate-500">
                +{movie.genres.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Quality Badge */}
        {movie.vote_average > 8 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="mt-3 inline-block bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
          >
            ✨ Critically Acclaimed
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MovieCard;
