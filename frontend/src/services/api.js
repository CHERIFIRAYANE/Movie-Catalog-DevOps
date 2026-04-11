/**
 * API Service
 * Axios wrapper for backend API calls
 * 
 * Usage:
 *   import { getMovies, getFavorites } from './api.js'
 *   const movies = await getMovies(1, 'inception')
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
})

// Movies endpoints
export const getMovies = async (page = 1, search = '') => {
  try {
    const response = await apiClient.get('/movies/', {
      params: {
        page,
        search,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching movies:', error)
    throw error
  }
}

export const getMovieDetail = async (movieId) => {
  try {
    const response = await apiClient.get(`/movies/${movieId}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching movie ${movieId}:`, error)
    throw error
  }
}

// Favorites endpoints
export const getFavorites = async (page = 1) => {
  try {
    const response = await apiClient.get('/favorites/', {
      params: { page },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching favorites:', error)
    throw error
  }
}

export const addToFavorites = async (movieId) => {
  try {
    const response = await apiClient.post('/favorites/', {
      movie_id: movieId,
    })
    return response.data
  } catch (error) {
    console.error(`Error adding favorite ${movieId}:`, error)
    throw error
  }
}

export const removeFromFavorites = async (favoriteId) => {
  try {
    await apiClient.delete(`/favorites/${favoriteId}/`)
  } catch (error) {
    console.error(`Error removing favorite ${favoriteId}:`, error)
    throw error
  }
}

// Health check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health/')
    return response.data
  } catch (error) {
    console.error('Health check failed:', error)
    throw error
  }
}

export default apiClient
