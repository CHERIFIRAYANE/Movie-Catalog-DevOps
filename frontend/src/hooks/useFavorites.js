/**
 * Custom React hook for managing user favorites
 *
 * Usage:
 *   const { favorites, addFavorite, removeFavorite } = useFavorites()
 */

import { useState, useEffect } from "react";
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from "../services/api";

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's favorites on mount and when user changes (only if authenticated)
  useEffect(() => {
    const fetchFavorites = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem("access_token");
      if (!token) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getFavorites();
        setFavorites(data.results || []);
      } catch (err) {
        // Only log error if it's not a 401 (unauthorized)
        if (err.status !== 401) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [localStorage.getItem("access_token")]);

  const addFavorite = async (movieId) => {
    try {
      const newFavorite = await addToFavorites(movieId);
      setFavorites([...favorites, newFavorite]);
      return newFavorite;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeFavorite = async (movieIdOrFavoriteId) => {
    try {
      // Support both movieId and favoriteId for backwards compatibility
      // If it's a movieId, find the favorite record id first
      let favoriteId = movieIdOrFavoriteId;

      const favorite = favorites.find(
        (f) =>
          f.id === movieIdOrFavoriteId || f.movie?.id === movieIdOrFavoriteId,
      );

      if (favorite) {
        favoriteId = favorite.id;
      }

      await removeFromFavorites(favoriteId);
      setFavorites(favorites.filter((f) => f.id !== favoriteId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const isFavorited = (movieId) => {
    return favorites.some((f) => f.movie.id === movieId);
  };

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorited,
  };
};
