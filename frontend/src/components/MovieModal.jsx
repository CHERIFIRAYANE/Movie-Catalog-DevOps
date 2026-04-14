import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Calendar,
  Clock,
  DollarSign,
  Globe,
  AlertCircle,
} from "lucide-react";
import { getMovieDetail } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import FavoriteButton from "./FavoriteButton";

const MovieModal = ({
  movieId,
  onClose,
  isFavorited,
  onFavorite,
  onUnfavorite,
}) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        setLoading(true);
        const data = await getMovieDetail(movieId);
        setMovie(data);
        setError(null);
      } catch (err) {
        setError("Failed to load movie details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetail();
    }
  }, [movieId]);

  if (loading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        >
          <LoadingSpinner />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (error || !movie) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl p-8 max-w-md text-center"
          >
            <p className="text-red-400">{error || "Movie not found"}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const posterUrl = movie.poster_url
    ? movie.poster_url.startsWith("http")
      ? movie.poster_url
      : `https://image.tmdb.org/t/p/w500${movie.poster_url}`
    : "https://via.placeholder.com/300x450?text=No+Poster";

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "TBA";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40 flex items-center justify-center p-4 overflow-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden my-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition duration-200 backdrop-blur-md"
          >
            <X className="w-6 h-6 text-slate-300 hover:text-white" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 md:p-8">
            {/* Poster */}
            <div className="md:col-span-1 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative w-full max-w-xs"
              >
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="rounded-xl shadow-2xl w-full object-cover aspect-[3/4.5]"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/40 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-xl border border-white/20 hover:bg-black/50 transition">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-sm">
                    {movie.vote_average.toFixed(1)}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="md:col-span-2 flex flex-col justify-between"
            >
              {/* Title & Basic Info */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  {movie.title}
                </h1>

                {/* Metadata Row */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-300">
                  {movie.release_date ? (
                    <div className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                      <Calendar className="w-4 h-4" />
                      <span>{year}</span>
                    </div>
                  ) : null}
                  {movie.runtime > 0 ? (
                    <div className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                      <Clock className="w-4 h-4" />
                      <span>{movie.runtime} min</span>
                    </div>
                  ) : null}
                  {movie.budget > 0 ? (
                    <div className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                      <DollarSign className="w-4 h-4" />
                      <span>${(movie.budget / 1000000).toFixed(1)}M</span>
                    </div>
                  ) : null}
                  {movie.revenue > 0 ? (
                    <div className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                      <Globe className="w-4 h-4" />
                      <span>${(movie.revenue / 1000000).toFixed(1)}M</span>
                    </div>
                  ) : null}
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="px-3 py-1.5 bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-primary-300 rounded-full text-sm font-medium hover:border-primary-400 transition"
                      >
                        {genre}
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.overview && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-100 mb-3">
                      Overview
                    </h2>
                    <p className="text-slate-300 leading-relaxed text-base">
                      {movie.overview}
                    </p>
                  </div>
                )}

                {/* Vote Count & Popularity */}
                {(movie.vote_count > 0 || movie.popularity > 0) && (
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-700/50">
                    {movie.vote_count > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                          Vote Count
                        </p>
                        <p className="text-lg font-semibold text-slate-100">
                          {movie.vote_count.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {movie.popularity > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                          Popularity
                        </p>
                        <p className="text-lg font-semibold text-slate-100">
                          {movie.popularity.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-700/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition duration-200"
                >
                  Close
                </motion.button>
                <FavoriteButton
                  movieId={movie.id}
                  isFavorited={isFavorited}
                  onFavorite={onFavorite}
                  onUnfavorite={() => setShowRemoveConfirm(true)}
                  variant="large"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Remove Confirmation Modal */}
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowRemoveConfirm(false);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-sm shadow-2xl border border-slate-700/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Remove from Favorites?
                </h3>
              </div>

              <p className="text-slate-300 mb-6">
                Are you sure you want to remove <strong>{movie.title}</strong>{" "}
                from your favorites?
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRemoveConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await onUnfavorite(movie.id);
                      setShowRemoveConfirm(false);
                    } catch (err) {
                      console.error("Failed to remove favorite:", err);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg font-semibold transition duration-200 shadow-lg shadow-red-500/30"
                >
                  Remove
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MovieModal;
