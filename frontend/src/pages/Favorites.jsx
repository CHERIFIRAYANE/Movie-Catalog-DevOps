/**
 * Favorites Page
 * Display user's saved favorite movies
 */

import React from "react";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";

const Favorites = ({ favorites, loading, onRemoveFavorite }) => {
  const handleRemove = async (movieId) => {
    const favorite = favorites.find((f) => f.movie.id === movieId);
    if (favorite) {
      try {
        await onRemoveFavorite(favorite.id);
      } catch (err) {
        console.error("Failed to remove favorite:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            ❤️ My Favorite Movies
          </h2>
          <p className="text-slate-400 text-lg">
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
                onUnfavorite={() => handleRemove(favorite.movie.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
