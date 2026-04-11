/**
 * Custom React hook for managing user favorites
 * 
 * Usage:
 *   const { favorites, addFavorite, removeFavorite } = useFavorites()
 */

import { useState, useEffect } from 'react'
import { getFavorites, addToFavorites, removeFromFavorites } from '../services/api'

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch user's favorites on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true)
      try {
        const data = await getFavorites()
        setFavorites(data.results || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  const addFavorite = async (movieId) => {
    try {
      const newFavorite = await addToFavorites(movieId)
      setFavorites([...favorites, newFavorite])
      return newFavorite
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const removeFavorite = async (favoriteId) => {
    try {
      await removeFromFavorites(favoriteId)
      setFavorites(favorites.filter(f => f.id !== favoriteId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const isFavorited = (movieId) => {
    return favorites.some(f => f.movie.id === movieId)
  }

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorited,
  }
}
