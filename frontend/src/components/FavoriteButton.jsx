/**
 * FavoriteButton Component
 * Toggle movie as favorite with visual feedback
 */

import React, { useState } from 'react'

const FavoriteButton = ({ movieId, isFavorited, onFavorite, onUnfavorite }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (isFavorited) {
        await onUnfavorite(movieId)
      } else {
        await onFavorite(movieId)
      }
    } catch (err) {
      setError(err.message)
      console.error('Favorite action failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-full font-bold text-sm transition-all duration-300
          ${isFavorited
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          flex items-center gap-2 shadow-lg
        `}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Loading...</span>
          </>
        ) : isFavorited ? (
          <>
            <span>❤️</span>
            <span>Favorited</span>
          </>
        ) : (
          <>
            <span>🤍</span>
            <span>Add to Favorites</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 bg-red-600 text-white text-xs px-3 py-1 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}

export default FavoriteButton
