/**
 * LoadingSpinner Component
 * Shows loading state while fetching data
 */

import React from 'react'

const LoadingSpinner = ({ message = 'Loading movies...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-dark-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-400 text-lg">{message}</p>
      <div className="mt-4 text-slate-500 text-sm">
        🎬 Finding amazing movies for you...
      </div>
    </div>
  )
}

export default LoadingSpinner
