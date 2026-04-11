/**
 * Main App component
 * Root component for the React application
 */

/**
 * Main App Component
 * Routes between pages and manages global state
 */

import React, { useState, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import { useFavorites } from './hooks/useFavorites'
import { healthCheck } from './services/api'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [apiStatus, setApiStatus] = useState({ healthy: false, message: 'Checking...' })
  const { favorites, loading: favLoading, addFavorite, removeFavorite } = useFavorites()

  // Check API health on mount
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const data = await healthCheck()
        setApiStatus({
          healthy: data.status === 'healthy',
          message: `API: ${data.status} | DB: ${data.database} | Cache: ${data.cache}`,
        })
      } catch (err) {
        setApiStatus({
          healthy: false,
          message: `API Connection Failed: ${err.message}`,
        })
      }
    }

    checkAPI()
    // Check every 60 seconds
    const interval = setInterval(checkAPI, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleNavigate = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-900">
        {/* API Status Banner */}
        <div className={`
          ${apiStatus.healthy ? 'bg-green-900 border-green-600' : 'bg-red-900 border-red-600'}
          border-b text-sm px-4 py-2 text-center
        `}>
          <span className={apiStatus.healthy ? 'text-green-300' : 'text-red-300'}>
            {apiStatus.healthy ? '✅' : '⚠️'} {apiStatus.message}
          </span>
        </div>

        {/* Header Navigation */}
        <Header currentPage={currentPage} onNavigate={handleNavigate} />

        {/* Main Content */}
        <main className="transition-all duration-300">
          {currentPage === 'home' ? (
            <Home
              favorites={favorites}
              onAddFavorite={addFavorite}
              onRemoveFavorite={removeFavorite}
            />
          ) : (
            <Favorites
              favorites={favorites}
              loading={favLoading}
              onRemoveFavorite={removeFavorite}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-dark-800 border-t border-dark-700 mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-400">
              🎬 Movie Catalog v1.0 | Built with React + Django + PostgreSQL
            </p>
            <p className="text-slate-500 text-sm mt-2">
              © 2026 • Learning Project
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
