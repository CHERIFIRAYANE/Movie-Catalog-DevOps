/**
 * Favorites Page
 * Display user's saved favorite movies
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";

const Favorites = ({ favorites, loading, onRemoveFavorite }) => {
  const [movieToRemove, setMovieToRemove] = useState(null);

  const handleRemoveClick = (movieId) => {
    setMovieToRemove(movieId);
  };

  const confirmRemove = async () => {
    const favorite = favorites.find((f) => f.movie.id === movieToRemove);
    if (favorite) {
      try {
        await onRemoveFavorite(favorite.id);
        setMovieToRemove(null);
      } catch (err) {
        console.error("Failed to remove favorite:", err);
      }
    }
  };

  const movieTitle = favorites.find((f) => f.movie.id === movieToRemove)?.movie
    .title;

  return (
    <div className="min-h-screen bg-transparent dark:bg-dark-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
            ❤️ My Favorite Movies
          </h2>
          <p className="text-slate-700 dark:text-slate-400 text-lg transition-colors duration-300 ">
            {favorites.length} {favorites.length === 1 ? "movie" : "movies"}{" "}
            saved
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner message="Loading your favorites..." />
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No favorites yet
            </h3>
            <p className="text-slate-400 mb-6">
              Browse movies and click the heart to save your favorites!
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Browse Movies
            </a>
          </div>
        ) : (
          <div className="movie-grid slide-in">
            {favorites.map((favorite) => (
              <MovieCard
                key={favorite.id}
                movie={favorite.movie}
                isFavorited={true}
                onFavorite={() => {}}
                onUnfavorite={() => handleRemoveClick(favorite.movie.id)}
              />
            ))}
          </div>
        )}

        {/* Remove Confirmation Modal */}
        <AnimatePresence>
          {movieToRemove && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMovieToRemove(null)}
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
                  Are you sure you want to remove <strong>{movieTitle}</strong>{" "}
                  from your favorites?
                </p>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMovieToRemove(null)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={confirmRemove}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg font-semibold transition duration-200 shadow-lg shadow-red-500/30"
                  >
                    Remove
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Favorites;
