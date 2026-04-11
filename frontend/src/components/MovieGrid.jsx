/**
 * MovieGrid Component
 * Displays paginated grid of movies with search and filters
 */

import React from 'react'
import MovieCard from './MovieCard'
import SearchBar from './SearchBar'
import Pagination from './Pagination'
import LoadingSpinner from './LoadingSpinner'

const MovieGrid = ({ 
  movies, 
  loading, 
  error,
  page,
  hasNext,
  totalCount,
  onNextPage,
  onPrevPage,
  onSearch,
  isFavoritedFn,
  onFavorite,
  onUnfavorite
}) => {
  if (error) {
    return (
      <div className="bg-red-900 border-2 border-red-600 text-red-200 px-6 py-4 rounded-lg">
        <h3 className="font-bold mb-2">❌ Error Loading Movies</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Search Bar */}
      <SearchBar onSearch={onSearch} />

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner message="Loading movies..." />
      ) : movies.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold text-white mb-2">No movies found</h3>
          <p className="text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          {/* Movie Grid */}
          <div className="movie-grid slide-in">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isFavorited={isFavoritedFn(movie.id)}
                onFavorite={onFavorite}
                onUnfavorite={onUnfavorite}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            hasNext={hasNext}
            onNextPage={onNextPage}
            onPrevPage={onPrevPage}
            totalCount={totalCount}
          />
        </>
      )}
    </div>
  )
}

export default MovieGrid
