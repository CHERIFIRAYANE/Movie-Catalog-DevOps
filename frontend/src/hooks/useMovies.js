/**
 * Custom React hook for fetching movies
 *
 * Usage:
 *   const { movies, loading, error, nextPage, prevPage } = useMovies()
 */

import { useState, useEffect } from "react";
import { getMovies } from "../services/api";

export const useMovies = (initialPage = 1, initialSearch = "") => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [hasNext, setHasNext] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMovies(page, search);
        setMovies(data.results || []);
        setHasNext(!!data.next);
        setCount(data.count);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, search]);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const setSearchTerm = (term) => {
    setSearch(term);
    setPage(1);
  };

  return {
    movies,
    loading,
    error,
    page,
    hasNext,
    count,
    nextPage,
    prevPage,
    setSearchTerm,
  };
};
