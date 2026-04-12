/**
 * API Service
 * Axios wrapper for backend API calls with automatic token refresh
 *
 * Usage:
 *   import { getMovies, getFavorites } from './api.js'
 *   const movies = await getMovies(1, 'inception')
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

// Add JWT token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors with automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      return apiClient
        .post("/auth/refresh/", {
          refresh: refreshToken,
        })
        .then(({ data }) => {
          const { access } = data;
          localStorage.setItem("access_token", access);
          apiClient.defaults.headers.common["Authorization"] =
            "Bearer " + access;
          originalRequest.headers["Authorization"] = "Bearer " + access;
          processQueue(null, access);
          return apiClient(originalRequest);
        })
        .catch((err) => {
          processQueue(err, null);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(err);
        });
    }

    return Promise.reject(error);
  },
);

// Movies endpoints
export const getMovies = async (page = 1, search = "") => {
  try {
    const response = await apiClient.get("/movies/", {
      params: {
        page,
        search,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
};

export const getMovieDetail = async (movieId) => {
  try {
    const response = await apiClient.get(`/movies/${movieId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie ${movieId}:`, error);
    throw error;
  }
};

// Favorites endpoints
export const getFavorites = async (page = 1) => {
  try {
    const response = await apiClient.get("/favorites/", {
      params: { page },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }
};

// Advanced Search
export const advancedSearch = async (params = {}) => {
  try {
    const response = await apiClient.get("/search/", {
      params: {
        q: params.q || "",
        genres: params.genres ? params.genres.join(",") : "",
        year_min: params.year_min || "",
        year_max: params.year_max || "",
        rating_min: params.rating_min || "",
        page: params.page || 1,
        page_size: params.page_size || 20,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Advanced search error:", error);
    throw error;
  }
};

export const searchAutocomplete = async (query = "", limit = 10) => {
  try {
    const response = await apiClient.get("/autocomplete/", {
      params: {
        q: query,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Autocomplete error:", error);
    throw error;
  }
};

export const addToFavorites = async (movieId) => {
  try {
    const response = await apiClient.post("/favorites/", {
      movie_id: movieId,
    });
    return response.data;
  } catch (error) {
    console.error(`Error adding favorite ${movieId}:`, error);
    throw error;
  }
};

export const removeFromFavorites = async (favoriteId) => {
  try {
    await apiClient.delete(`/favorites/${favoriteId}/`);
  } catch (error) {
    console.error(`Error removing favorite ${favoriteId}:`, error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get("/health/");
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};

export default apiClient;
