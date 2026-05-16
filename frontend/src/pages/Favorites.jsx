/**
 * Favorites Page
 * Display user's saved favorite movies
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";
import MovieModal from "../components/MovieModal";

const Favorites = ({ favorites, loading, onRemoveFavorite }) => {
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const handleRemoveFavorite = async (movieId) => {
    const favorite = favorites.find((f) => f.movie?.id === movieId);
    if (favorite) {
      try {
        await onRemoveFavorite(favorite.id);
        if (selectedMovieId === movieId) {
          setSelectedMovieId(null);
        }
      } catch (err) {
        console.error("Failed to remove favorite:", err);
      }
    }
  };

  const isMovieFavorited = (movieId) =>
    favorites.some((favorite) => favorite.movie?.id === movieId);

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
                onUnfavorite={handleRemoveFavorite}
                onMovieClick={setSelectedMovieId}
              />
            ))}
          </div>
        )}

        {selectedMovieId && (
          <MovieModal
            movieId={selectedMovieId}
            onClose={() => setSelectedMovieId(null)}
            isFavorited={isMovieFavorited(selectedMovieId)}
            onFavorite={() => {}}
            onUnfavorite={handleRemoveFavorite}
          />
        )}
      </div>
    </div>
  );
};

export default Favorites;
