import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";

const FavoriteButton = ({
  movieId,
  isFavorited,
  onFavorite,
  onUnfavorite,
  variant = "default",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const isLarge = variant === "large";

  const handleClick = async (e) => {
    // Prevent event from bubbling up to parent click handlers (e.g., modal open)
    e.stopPropagation();

    setIsLoading(true);
    try {
      if (isFavorited) {
        await onUnfavorite(movieId);
      } else {
        await onFavorite(movieId);
      }
    } catch (err) {
      console.error("Favorite action failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`
        rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2
        ${isLarge ? "px-6 py-3" : "p-3"}
        ${
          isFavorited
            ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/50 hover:shadow-rose-500/70"
            : "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70"
        }
        ${isLoading ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}
      `}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2
              className={`${isLarge ? "w-6 h-6" : "w-5 h-5"} animate-spin`}
            />
          </motion.div>
        ) : (
          <motion.div
            key="heart"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Heart
              className={`${isLarge ? "w-6 h-6" : "w-5 h-5"} ${isFavorited ? "fill-current" : ""}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {isLarge && (
        <span className="text-sm">
          {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
        </span>
      )}
    </motion.button>
  );
};

export default FavoriteButton;
