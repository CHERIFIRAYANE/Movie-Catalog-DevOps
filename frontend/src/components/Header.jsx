/**
 * Navigation Header Component
 * Top bar with logo and navigation links
 */

import React from 'react'

const Header = ({ currentPage, onNavigate }) => {
  return (
    <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        {/* Logo & Title */}
        <div 
          onClick={() => onNavigate('home')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            🎬 Movie Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">Discover & Save Your Favorites</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex gap-4">
          <button
            onClick={() => onNavigate('home')}
            className={`
              px-6 py-2 rounded-lg font-bold transition-all duration-300
              ${currentPage === 'home'
                ? 'bg-blue-600 text-white'
                : 'bg-dark-700 text-slate-300 hover:bg-dark-600'
              }
            `}
          >
            🏠 Browse
          </button>
          <button
            onClick={() => onNavigate('favorites')}
            className={`
              px-6 py-2 rounded-lg font-bold transition-all duration-300
              ${currentPage === 'favorites'
                ? 'bg-red-600 text-white'
                : 'bg-dark-700 text-slate-300 hover:bg-dark-600'
              }
            `}
          >
            ❤️ My Favorites
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
