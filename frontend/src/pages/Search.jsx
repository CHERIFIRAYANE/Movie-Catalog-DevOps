/**
 * Advanced Search Page
 * Professional full-text search with Elasticsearch
 */
import React, { useState, useCallback } from "react";
import AdvancedSearch from "../components/AdvancedSearch";
import MovieModal from "../components/MovieModal";

function Search({ isFavorited, onFavorite, onUnfavorite }) {
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const handleAddFavorite = async (movieId) => {
    try {
      await onFavorite(movieId);
    } catch (err) {
      console.error("Failed to add favorite:", err);
    }
  };

  const handleRemoveFavorite = async (movieId) => {
    try {
      await onUnfavorite(movieId);
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const memoizedSetSelectedMovieId = useCallback(setSelectedMovieId, []);

  return (
    <div>
      <AdvancedSearch
        onMovieClick={memoizedSetSelectedMovieId}
        isFavorited={isFavorited}
        onFavorite={handleAddFavorite}
        onUnfavorite={handleRemoveFavorite}
      />

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
}

export default Search;
