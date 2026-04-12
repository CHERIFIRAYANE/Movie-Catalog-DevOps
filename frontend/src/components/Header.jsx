import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clapperboard, Heart, LogOut, User } from "lucide-react";

const Header = ({ currentPage, onNavigate, user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/80 backdrop-blur-xl border-b border-slate-700/50"
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
              <div className="relative bg-slate-900 px-3 py-2 rounded-lg">
                <Clapperboard className="w-6 h-6 text-primary-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
                CineMa
              </h1>
              <p className="text-xs text-slate-400">Discover & Explore</p>
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
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
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
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favorites</span>
            </motion.button>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{user.email}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-red-900/30 transition-all duration-300 flex items-center gap-2"
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
