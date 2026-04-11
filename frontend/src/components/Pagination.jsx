/**
 * Pagination Component
 * Navigate through paginated movie results
 */

import React from 'react'

const Pagination = ({ currentPage, hasNext, onNextPage, onPrevPage, totalCount, pageSize = 20 }) => {
  const totalPages = Math.ceil(totalCount / pageSize)
  const startMovie = (currentPage - 1) * pageSize + 1
  const endMovie = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="mt-12 mb-8 flex flex-col items-center gap-4">
      {/* Page Info */}
      <div className="text-sm text-slate-400">
        Showing <span className="font-bold text-white">{startMovie}</span> to{' '}
        <span className="font-bold text-white">{endMovie}</span> of{' '}
        <span className="font-bold text-white">{totalCount}</span> movies
      </div>

      {/* Page Buttons */}
      <div className="flex gap-4 items-center">
        {/* Previous Button */}
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className={`
            px-6 py-2 rounded-lg font-bold transition-all duration-300
            ${currentPage === 1
              ? 'bg-dark-700 text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            }
          `}
        >
          ← Previous
        </button>

        {/* Page Number Indicator */}
        <div className="flex items-center gap-2">
          <div className="bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
            <span className="text-white font-bold">{currentPage}</span>
            <span className="text-slate-400 mx-2">of</span>
            <span className="text-slate-400">{totalPages}</span>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={onNextPage}
          disabled={!hasNext}
          className={`
            px-6 py-2 rounded-lg font-bold transition-all duration-300
            ${!hasNext
              ? 'bg-dark-700 text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            }
          `}
        >
          Next →
        </button>
      </div>

      {/* Page Size Info */}
      <div className="text-xs text-slate-500">
        {pageSize} movies per page
      </div>
    </div>
  )
}

export default Pagination
