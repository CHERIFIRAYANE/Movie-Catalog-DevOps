import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import Favorites from "./pages/Favorites";
import Search from "./pages/Search";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import { useFavorites } from "./hooks/useFavorites";
import { healthCheck } from "./services/api";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("search");
  const [apiStatus, setApiStatus] = useState({
    healthy: false,
    message: "Checking...",
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    favorites,
    loading: favLoading,
    addFavorite,
    removeFavorite,
  } = useFavorites();

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user data");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const data = await healthCheck();
        setApiStatus({
          healthy: data.status === "healthy",
          message: `API: ${data.status} | DB: ${data.database} | Cache: ${data.cache}`,
        });
      } catch (err) {
        setApiStatus({
          healthy: false,
          message: `Connection Failed`,
        });
      }
    };

    checkAPI();
    const interval = setInterval(checkAPI, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 light:bg-transparent flex items-center justify-center transition-colors duration-300\">
        <div className="dark:text-slate-400 light:text-slate-600 dark:bg-slate-800/50 light:bg-white/40 light:backdrop-blur-md px-6 py-4 rounded-lg">
          Loading...
        </div>
      </div>
    );
  }

  // Public routes (Register, Login, Verify) - no header
  const publicRoutesContent = (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route
        path="/login"
        element={<Login onLoginSuccess={handleLoginSuccess} />}
      />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  // Protected routes - with header
  const protectedRoutesContent = (
    <div className="min-h-screen dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 light:bg-transparent transition-colors duration-300">
      {/* API Status Banner */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`
            border-b transition-all duration-300
            ${
              apiStatus.healthy
                ? "dark:bg-gradient-to-r dark:from-emerald-950/50 dark:to-teal-950/50 dark:border-emerald-600/30 light:bg-emerald-500/10 light:border-emerald-300/30 light:backdrop-blur-md"
                : "dark:bg-gradient-to-r dark:from-red-950/50 dark:to-rose-950/50 dark:border-red-600/30 light:bg-red-500/10 light:border-red-300/30 light:backdrop-blur-md"
            }
            dark:backdrop-blur-xl
          `}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3 text-sm">
              {apiStatus.healthy ? (
                <>
                  <CheckCircle className="w-5 h-5 dark:text-emerald-400 light:text-emerald-600" />
                  <span className="dark:text-emerald-400 light:text-emerald-700 font-medium">
                    API Connected
                  </span>
                  <span className="dark:text-emerald-300/70 light:text-emerald-600/70 text-xs ml-2">
                    {apiStatus.message}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 dark:text-red-400 light:text-red-600 animate-pulse" />
                  <span className="dark:text-red-400 light:text-red-700 font-medium">
                    API Offline
                  </span>
                  <span className="dark:text-red-300/70 light:text-red-600/70 text-xs ml-2">
                    {apiStatus.message}
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Header Navigation */}
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1"
      >
        <AnimatePresence mode="wait">
          {currentPage === "search" ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Search
                isFavorited={(movieId) =>
                  favorites.some(
                    (f) => f.movie_id === movieId || f.movie?.id === movieId,
                  )
                }
                onFavorite={addFavorite}
                onUnfavorite={removeFavorite}
              />
            </motion.div>
          ) : (
            <motion.div
              key="favorites"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Favorites
                favorites={favorites}
                loading={favLoading}
                onRemoveFavorite={removeFavorite}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-t from-slate-950 to-slate-900/50 border-t border-slate-700/30 mt-16 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 font-medium">
            🎬 CineMa • Discover & Explore Movies
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Modern Movie Catalog Built with React, Django & PostgreSQL
          </p>
        </div>
      </motion.footer>
    </div>
  );

  // Check if user is authenticated
  if (!user) {
    return <ErrorBoundary>{publicRoutesContent}</ErrorBoundary>;
  }

  return <ErrorBoundary>{protectedRoutesContent}</ErrorBoundary>;
}

export default App;
