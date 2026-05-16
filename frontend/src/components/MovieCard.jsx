import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, Calendar, AlertCircle } from "lucide-react";
import FavoriteButton from "./FavoriteButton";

const MovieCard = ({
  movie,
  isFavorited,
  onFavorite,
  onUnfavorite,
  onMovieClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

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
      className="group rounded-xl overflow-hidden dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 light:bg-white/60 light:backdrop-blur-md light:border light:border-white/55 shadow-lg hover:shadow-2xl dark:hover:shadow-primary-500/20 light:hover:shadow-lg light:hover:shadow-slate-300/60 transition-all duration-300 cursor-pointer"
    >
      {/* Poster Container */}
      <div
        onClick={() => onMovieClick?.(movie.id)}
        className="relative overflow-hidden aspect-[3/4.5] dark:bg-slate-950 light:bg-slate-200 cursor-pointer transition-colors duration-300"
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
            onUnfavorite={() => setShowRemoveConfirm(true)}
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
        <h3 className="font-semibold text-sm dark:text-slate-100 light:text-slate-800 truncate group-hover:text-primary-500 transition-colors line-clamp-2">
          {movie.title}
        </h3>

        {/* Year */}
        <div className="flex items-center gap-1 text-xs dark:text-slate-400 light:text-slate-600 mt-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{year}</span>
        </div>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-3">
            {movie.genres.slice(0, 2).map((genre, idx) => (
              <span
                key={idx}
                className="text-xs dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50 light:bg-slate-100 light:text-slate-700 light:border-slate-300 px-2 py-1 rounded-full border hover:border-primary-400/50 transition-colors"
              >
                {genre}
              </span>
            ))}
            {movie.genres.length > 2 && (
              <span className="text-xs dark:text-slate-500 light:text-slate-600">
                +{movie.genres.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Quality Badge */}
        {movie.vote_average > 8 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="mt-3 inline-block dark:bg-gradient-to-r dark:from-emerald-600/20 dark:to-teal-600/20 dark:text-emerald-400 dark:border-emerald-500/30 light:bg-emerald-100/80 light:text-emerald-700 light:border-emerald-300 px-3 py-1 rounded-full text-xs font-medium border hover:border-emerald-500/60 transition-colors"
          >
            ✨ Critically Acclaimed
          </motion.div>
        )}
      </motion.div>

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowRemoveConfirm(false);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-sm shadow-2xl border border-slate-700/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Remove from Favorites?
                </h3>
              </div>

              <p className="text-slate-300 mb-6">
                Are you sure you want to remove <strong>{movie.title}</strong>{" "}
                from your favorites?
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRemoveConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await onUnfavorite(movie.id);
                      setShowRemoveConfirm(false);
                    } catch (err) {
                      console.error("Failed to remove favorite:", err);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg font-semibold transition duration-200 shadow-lg shadow-red-500/30"
                >
                  Remove
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MovieCard;
