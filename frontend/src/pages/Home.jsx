/**
 * Home Page
 * Main catalog browsing page with search and pagination
 */

import React from 'react'
import MovieGrid from '../components/MovieGrid'
import { useMovies } from '../hooks/useMovies'

const Home = ({ favorites, onAddFavorite, onRemoveFavorite }) => {
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
  } = useMovies(1, '')

  const isFavorited = (movieId) => {
    return favorites.some(f => f.movie.id === movieId)
  }

  const handleAddFavorite = async (movieId) => {
    try {
      await onAddFavorite(movieId)
      // Optional: Show success toast
    } catch (err) {
      console.error('Failed to add favorite:', err)
    }
  }

  const handleRemoveFavorite = async (movieId) => {
    try {
      const favorite = favorites.find(f => f.movie.id === movieId)
      if (favorite) {
        await onRemoveFavorite(favorite.id)
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Discover Amazing Movies
          </h2>
          <p className="text-slate-400 text-lg">
            Browse {count.toLocaleString()} movies, search for your favorites, and build your collection
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
          onNextPage={nextPage}
          onPrevPage={prevPage}
          onSearch={setSearchTerm}
          isFavoritedFn={isFavorited}
          onFavorite={handleAddFavorite}
          onUnfavorite={handleRemoveFavorite}
        />
      </div>
    </div>
  )
}

export default Home
