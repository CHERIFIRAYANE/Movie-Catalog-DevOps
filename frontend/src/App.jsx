/**
 * Main App component
 * Root component for the React application
 */

import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    // Test API connection
    fetch('/api/health/')
      .then(res => res.json())
      .then(data => setStatus(`API Status: ${data.status}`))
      .catch(err => setStatus(`API Error: ${err.message}`))
  }, [])

  return (
    <div className="container">
      <header>
        <h1>🎬 Movie Catalog</h1>
        <p>Discover and save your favorite movies</p>
      </header>
      
      <main>
        <p className="status">{status}</p>
        <p>Frontend is up and running! Phase 3 (Frontend components) coming next...</p>
      </main>
      
      <footer>
        <p>&copy; 2026 Movie Catalog Project</p>
      </footer>
    </div>
  )
}

export default App
