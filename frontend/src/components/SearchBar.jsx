/**
 * SearchBar Component
 * Search input with debouncing to avoid excessive API calls
 */

import React, { useState, useEffect } from 'react'

const SearchBar = ({ onSearch, placeholder = 'Search movies...' }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length > 0 || searchTerm === '') {
        setIsSearching(true)
        onSearch(searchTerm)
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, onSearch])

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <div className="w-full mb-8">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="
            w-full px-4 py-3 pl-12 pr-12
            bg-dark-800 border-2 border-dark-700
            text-white placeholder-slate-500
            rounded-lg
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            transition-all duration-300
          "
        />

        {/* Search Icon */}
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
          🔍
        </span>

        {/* Clear Button */}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            title="Clear search"
          >
            ✕
          </button>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 animate-spin">
            ⏳
          </span>
        )}
      </div>

      {/* Search Hint */}
      {searchTerm && (
        <p className="text-sm text-slate-400 mt-2">
          Found results for "{searchTerm}"
        </p>
      )}
    </div>
  )
}

export default SearchBar
