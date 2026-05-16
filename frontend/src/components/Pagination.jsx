import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage,
  hasNext,
  onNextPage,
  onPrevPage,
  totalCount,
  pageSize = 20,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startMovie = (currentPage - 1) * pageSize + 1;
  const endMovie = Math.min(currentPage * pageSize, totalCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-12 mb-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        {/* Page Info */}
        <div className="text-sm text-slate-400 text-center">
          Showing{" "}
          <span className="font-semibold text-slate-200">{startMovie}</span> to{" "}
          <span className="font-semibold text-slate-200">{endMovie}</span> of{" "}
          <span className="font-semibold text-slate-200">
            {totalCount.toLocaleString()}
          </span>{" "}
          movies
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className={`p-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              currentPage === 1
                ? "bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-lg hover:shadow-primary-500/50 cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </motion.button>

          {/* Page Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 min-w-24 text-center"
          >
            <span className="font-bold text-primary-400">{currentPage}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{totalPages}</span>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNextPage}
            disabled={!hasNext}
            className={`p-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              !hasNext
                ? "bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-accent-600 to-accent-500 text-white hover:shadow-lg hover:shadow-accent-500/50 cursor-pointer"
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        <p className="text-xs text-slate-500">{pageSize} movies per page</p>
      </div>
    </motion.div>
  );
};

export default Pagination;
