/**
 * Advanced Search Page
 * Professional full-text search with Elasticsearch
 */
import React, { useState, useCallback, useEffect } from "react";
import AdvancedSearch from "../components/AdvancedSearch";
import MovieModal from "../components/MovieModal";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { getRecommendations } from "../services/api";

function Search({ isFavorited, onFavorite, onUnfavorite }) {
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  const handleAddFavorite = async (movieId) => {
    try {
      await onFavorite(movieId);
      await loadRecommendations();
    } catch (err) {
      console.error("Failed to add favorite:", err);
    }
  };

  const handleRemoveFavorite = async (movieId) => {
    try {
      await onUnfavorite(movieId);
      await loadRecommendations();
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const loadRecommendations = useCallback(async () => {
    try {
      setRecommendationsLoading(true);
      const data = await getRecommendations(6);
      setRecommendations(data.results || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const memoizedSetSelectedMovieId = useCallback(setSelectedMovieId, []);

  const recommendationsSection = (
    <section className="pt-2 pb-5">
      <div className="rounded-2xl border border-white/20 dark:border-slate-700/40 bg-white/35 dark:bg-slate-900/40 backdrop-blur-md px-4 md:px-6 py-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
              Recommended For You
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-400 transition-colors duration-300">
              Curated picks from your profile and trending high-rated movies.
            </p>
          </div>
          <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            {recommendations.length} picks
          </span>
        </div>

        {recommendationsLoading ? (
          <LoadingSpinner message="Preparing recommendations..." />
        ) : recommendations.length > 0 ? (
          <div className="recommendations-strip slide-in">
            {recommendations.map((movie) => (
              <div
                key={movie.id}
                className="recommendation-item w-[220px] sm:w-[240px] shrink-0"
              >
                <MovieCard
                  movie={movie}
                  isFavorited={isFavorited(movie.id)}
                  onFavorite={handleAddFavorite}
                  onUnfavorite={handleRemoveFavorite}
                  onMovieClick={memoizedSetSelectedMovieId}
                />
                <p className="mt-2 px-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {movie.recommendation_reason || "Suggested for you"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300 py-2">
            No recommendations yet. Add a few favorites to improve
            personalization.
          </p>
        )}
      </div>
    </section>
  );

  return (
    <div>
      <AdvancedSearch
        onMovieClick={memoizedSetSelectedMovieId}
        isFavorited={isFavorited}
        onFavorite={handleAddFavorite}
        onUnfavorite={handleRemoveFavorite}
        topSection={recommendationsSection}
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
