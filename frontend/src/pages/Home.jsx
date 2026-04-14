/**
 * Home Page
 * Main catalog browsing page with search and pagination
 */

import React, { useCallback, useState } from "react";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import { useMovies } from "../hooks/useMovies";

const Home = ({ favorites, onAddFavorite, onRemoveFavorite }) => {
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const {
    movies,
    loading,
    error,
    page,
    hasNext,
    count,
    nextPage,
    prevPage,
    setSearchTerm,
  } = useMovies();

  const isFavorited = (movieId) => {
    return favorites.some((f) => f.movie.id === movieId);
  };

  const handleAddFavorite = async (movieId) => {
    try {
      await onAddFavorite(movieId);
      // Optional: Show success toast
    } catch (err) {
      console.error("Failed to add favorite:", err);
    }
  };

  const handleRemoveFavorite = async (movieId) => {
    try {
      const favorite = favorites.find((f) => f.movie.id === movieId);
      if (favorite) {
        await onRemoveFavorite(favorite.id);
      }
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  // Memoize setSearchTerm to prevent SearchBar from re-running its effects
  const memoizedSetSearchTerm = useCallback(setSearchTerm, [setSearchTerm]);
  const memoizedNextPage = useCallback(nextPage, [nextPage]);
  const memoizedPrevPage = useCallback(prevPage, [prevPage]);
  const memoizedSetSelectedMovieId = useCallback(setSelectedMovieId, []);

  return (
    <div className="min-h-screen bg-transparent dark:bg-dark-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
            Discover Amazing Movies
          </h2>
          <p className="text-slate-700 dark:text-slate-400 text-lg transition-colors duration-300">
            Browse {count.toLocaleString()} movies, search for your favorites,
            and build your collection
          </p>
        </div>

        {/* Movie Grid */}
        <MovieGrid
          movies={movies}
          loading={loading}
          error={error}
          page={page}
          hasNext={hasNext}
          totalCount={count}
          onNextPage={memoizedNextPage}
          onPrevPage={memoizedPrevPage}
          onSearch={memoizedSetSearchTerm}
          isFavoritedFn={isFavorited}
          onFavorite={handleAddFavorite}
          onUnfavorite={handleRemoveFavorite}
          onMovieClick={memoizedSetSelectedMovieId}
        />
      </div>

      {/* Movie Detail Modal */}
      {selectedMovieId && (
        <MovieModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
          isFavorited={isFavorited(selectedMovieId)}
          onFavorite={handleAddFavorite}
          onUnfavorite={handleRemoveFavorite}
        />
      )}
    </div>
  );
};

export default Home;
