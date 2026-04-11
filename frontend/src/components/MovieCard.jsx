/**
 * MovieCard Component
 * Displays a single movie with poster, title, rating, and favorite button
 */

import React from 'react'
import FavoriteButton from './FavoriteButton'

const MovieCard = ({ movie, isFavorited, onFavorite, onUnfavorite }) => {
  const posterUrl = movie.poster_url 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_url}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster'

  const year = movie.release_date 
    ? new Date(movie.release_date).getFullYear() 
    : 'TBA'

  return (
    <div className="bg-dark-800 rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group cursor-pointer">
      {/* Poster Image */}
      <div className="relative overflow-hidden bg-dark-700 aspect-video sm:aspect-auto">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-64 object-cover group-hover:brightness-110 transition-all duration-300"
          loading="lazy"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-amber-500 text-dark-900 px-3 py-1 rounded-full text-sm font-bold">
          ⭐ {movie.vote_average.toFixed(1)}
        </div>

        {/* Favorite Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <FavoriteButton 
            movieId={movie.id}
            isFavorited={isFavorited}
            onFavorite={onFavorite}
            onUnfavorite={onUnfavorite}
          />
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="text-white font-bold text-sm truncate group-hover:text-blue-400 transition-colors">
          {movie.title}
        </h3>
        
        <p className="text-slate-400 text-xs mt-1">
          {year}
        </p>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {movie.genres.slice(0, 2).map((genre, idx) => (
              <span
                key={idx}
                className="text-xs bg-dark-700 text-slate-300 px-2 py-1 rounded"
              >
                {genre}
              </span>
            ))}
            {movie.genres.length > 2 && (
              <span className="text-xs text-slate-500">+{movie.genres.length - 2}</span>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-dark-700 text-xs text-slate-400">
          {movie.vote_average > 8 && (
            <span className="inline-block bg-green-900 text-green-300 px-2 py-1 rounded">
              🔥 Highly Rated
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MovieCard
