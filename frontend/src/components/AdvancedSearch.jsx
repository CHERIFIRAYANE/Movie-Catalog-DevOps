/**
 * Advanced Search Component
 * Professional full-text search with filtering by genre, year, and rating
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Loader,
  ChevronDown,
  Filter,
  RotateCcw,
} from "lucide-react";
import { advancedSearch, searchAutocomplete } from "../services/api";
import MovieGrid from "./MovieGrid";
import LoadingSpinner from "./LoadingSpinner";

const AdvancedSearch = ({
  onMovieClick,
  isFavorited,
  onFavorite,
  onUnfavorite,
}) => {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [page, setPage] = useState(1);

  // Results and metadata
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false); // Start HIDDEN by default

  const autocompleteRef = useRef(null);
  const autocompleteTimeoutRef = useRef(null);

  // Debounced autocomplete search
  const handleAutocomplete = useCallback((searchQuery) => {
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    autocompleteTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchAutocomplete(searchQuery, 5);
        setAutocompleteResults(data.suggestions || []);
        setShowAutocomplete(true);
      } catch (err) {
        console.error("Autocomplete failed:", err);
      }
    }, 300);
  }, []);

  // Handle query change
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleAutocomplete(value);
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (suggestion) => {
    setQuery(suggestion);
    setShowAutocomplete(false);
    setPage(1);
    // Trigger search immediately with the suggestion
    handleSearch(1, suggestion);
  };

  // Toggle genre selection
  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
    setPage(1);
  };

  // Auto-search when filters change (genre, year, rating)
  useEffect(() => {
    if (availableGenres.length > 0 || yearMin || yearMax || ratingMin) {
      handleSearch(1);
    }
  }, [selectedGenres, yearMin, yearMax, ratingMin]);

  // Perform search
  const handleSearch = async (searchPage = 1, searchQuery = null) => {
    setError(null);
    setLoading(true);
    setPage(searchPage);

    try {
      const data = await advancedSearch({
        q: (searchQuery || query).trim(),
        genres: selectedGenres,
        year_min: yearMin ? parseInt(yearMin) : undefined,
        year_max: yearMax ? parseInt(yearMax) : undefined,
        rating_min: ratingMin ? parseFloat(ratingMin) : undefined,
        page: searchPage,
        page_size: 20,
      });

      setResults(data.results || []);
      setTotalResults(data.total);
      setTotalPages(data.total_pages);
      setAvailableGenres(data.available_genres || []);
      setAvailableYears(data.available_years || []);
    } catch (err) {
      setError("Failed to search movies. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial search on mount
  useEffect(() => {
    handleSearch(1);
  }, []);

  // Reset filters
  const handleResetFilters = () => {
    setQuery("");
    setSelectedGenres([]);
    setYearMin("");
    setYearMax("");
    setRatingMin("");
    setPage(1);
    setAutocompleteResults([]);
    setShowAutocomplete(false);
  };

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-transparent dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-850 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/30 light:backdrop-blur-md border-b border-white/30 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-900/50 dark:backdrop-blur-md dark:border-slate-800/50 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="relative" ref={autocompleteRef}>
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-500 dark:text-slate-400 pointer-events-none transition-colors duration-300" />
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search movies by title, actor, or keyword..."
                  className="w-full pl-12 pr-12 py-3 bg-white/60 border border-white/40 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white dark:placeholder-slate-400"
                  onFocus={() => query.trim() && setShowAutocomplete(true)}
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setShowAutocomplete(false);
                      setSelectedGenres([]);
                      setYearMin("");
                      setYearMax("");
                      setRatingMin("");
                      handleSearch(1); // Reset to initial state with all filters cleared
                    }}
                    className="absolute right-4 p-1 hover:bg-white/50 dark:hover:bg-slate-700 rounded transition"
                  >
                    <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showAutocomplete && autocompleteResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/90 border border-white/50 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-40 backdrop-blur-sm"
                  >
                    {autocompleteResults.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAutocompleteSelect(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-2"
                      >
                        <Search className="w-3 h-3 text-slate-500 dark:text-slate-500" />
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Toggle, Search Button, and Reset */}
            <div className="flex items-center gap-2 justify-between flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/60 hover:bg-white/80 border border-white/40 rounded-lg text-slate-700 transition dark:bg-slate-800/50 dark:hover:bg-slate-700/50 dark:border-slate-700/50 dark:text-slate-200"
                >
                  <Filter className="w-4 h-4" />
                  <span>{showFilters ? "Hide" : "Show"} Filters</span>
                </button>

                <button
                  onClick={() => handleSearch(1)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>

              {(query ||
                selectedGenres.length > 0 ||
                yearMin ||
                yearMax ||
                ratingMin) && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-3 py-2 bg-white/50 hover:bg-white/70 border border-white/40 rounded-lg text-slate-700 transition dark:bg-slate-700/50 dark:hover:bg-slate-600/50 dark:border-slate-600/50 dark:text-slate-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-4 border-t border-white/40 dark:border-slate-800"
                >
                  {/* Genre Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                      Genres
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableGenres.slice(0, 15).map((genre) => (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                            selectedGenres.includes(genre)
                              ? "bg-primary-600 text-white"
                              : "bg-white/70 text-slate-700 border border-white/50 hover:bg-white dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year Range Filter */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                        From Year
                      </label>
                      <select
                        value={yearMin}
                        onChange={(e) => {
                          setYearMin(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      >
                        <option value="">Any Year</option>
                        {availableYears
                          .sort((a, b) => a - b)
                          .map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                        To Year
                      </label>
                      <select
                        value={yearMax}
                        onChange={(e) => {
                          setYearMax(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      >
                        <option value="">Any Year</option>
                        {availableYears
                          .sort((a, b) => b - a)
                          .map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                        Min Rating
                      </label>
                      <select
                        value={ratingMin}
                        onChange={(e) => {
                          setRatingMin(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      >
                        <option value="">Any Rating</option>
                        <option value="5">5.0+</option>
                        <option value="6">6.0+</option>
                        <option value="7">7.0+</option>
                        <option value="8">8.0+</option>
                        <option value="9">9.0+</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-200"
          >
            {error}
          </motion.div>
        )}

        {/* Results Info */}
        {!loading && totalResults > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <p className="text-slate-700 dark:text-slate-300 transition-colors duration-300">
              Found{" "}
              <span className="font-semibold text-primary-400">
                {totalResults}
              </span>{" "}
              movies
              {query.trim() && ` for "${query}"`}
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MovieGrid
              movies={results}
              onMovieClick={onMovieClick}
              isFavoritedFn={isFavorited}
              onFavorite={onFavorite}
              onUnfavorite={onUnfavorite}
              page={page}
              totalCount={totalResults}
              hasNext={page < totalPages}
              onNextPage={() => handleSearch(page + 1)}
              onPrevPage={() => handleSearch(Math.max(1, page - 1))}
              hideSearchBar={true}
            />
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && totalResults === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search className="w-16 h-16 text-slate-500 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No movies found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Try adjusting your search filters or keywords
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
