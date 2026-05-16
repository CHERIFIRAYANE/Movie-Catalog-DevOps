import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clapperboard, Heart, LogOut, User, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Header = ({ currentPage, onNavigate, user, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/80 light:bg-white/40 light:backdrop-blur-md dark:backdrop-blur-xl border-b dark:border-slate-700/50 light:border-white/20 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("search")}
            className="cursor-pointer flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative dark:bg-slate-900 light:bg-white/30 light:backdrop-blur-sm px-3 py-2 rounded-lg dark:border-0 light:border light:border-white/40 transition-all duration-300 hover:light:bg-white/40">
                <Clapperboard className="w-6 h-6 text-primary-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
                CineMa
              </h1>
              <p className="text-xs dark:text-slate-400 light:text-slate-600">
                Discover & Explore
              </p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex gap-2 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("search")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                currentPage === "search"
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/50"
                  : "dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 dark:hover:bg-slate-800/50 light:hover:bg-white/20 light:backdrop-blur-sm light:border light:border-white/20 transition-all"
              }`}
            >
              <span>🎬 Browse</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("favorites")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                currentPage === "favorites"
                  ? "bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-lg shadow-accent-500/50"
                  : "dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 dark:hover:bg-slate-800/50 light:hover:bg-white/20 light:backdrop-blur-sm light:border light:border-white/20 transition-all"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favorites</span>
            </motion.button>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-3 ml-4 pl-4 dark:border-l dark:border-slate-700 light:border-l light:border-white/20">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 dark:text-slate-400 light:text-slate-600" />
                  <span className="text-sm dark:text-slate-300 light:text-slate-700 transition-colors duration-300">
                    {user.email}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className="px-3 py-2 rounded-lg font-medium dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 dark:hover:bg-slate-700/50 light:hover:bg-white/20 light:backdrop-blur-sm light:border light:border-white/20 transition-all duration-300 flex items-center gap-2"
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg font-medium dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 dark:hover:bg-red-900/30 light:hover:bg-red-500/10 light:backdrop-blur-sm light:border light:border-white/20 transition-all duration-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
