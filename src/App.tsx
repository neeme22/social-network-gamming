import React, { useState, useEffect } from "react";
import { User, Post, Game } from "./types";
import { api, getActiveSessionUserId, setActiveSessionUserId } from "./api";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import GameCatalog from "./components/GameCatalog";
import GameDetails from "./components/GameDetails";
import UserProfile from "./components/UserProfile";

import {
  Gamepad2,
  Users,
  Grid3X3,
  Calendar,
  MessageSquare,
  LogOut,
  ChevronRight,
  Sparkles,
  Zap,
  Lock
} from "lucide-react";

export default function App() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [games, setGames] = useState<Game[]>([]);

  // Navigation states
  const [currentTab, setCurrentTab] = useState<"feed" | "games" | "profile">("feed");
  // Subview states (clicking a game or a user profile details)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const [bootstrapping, setBootstrapping] = useState(true);

  // Load baseline app collections
  const loadInitialData = async () => {
    try {
      // Get all reg users for fast account switching list
      const userList = await api.getAllUsers();
      setAllUsers(userList);

      // Check for current user session
      try {
        const me = await api.getCurrentUser();
        setActiveUser(me);
      } catch (e) {
        // Fallback or show login
        setActiveUser(null);
      }

      const activeGames = await api.getGames();
      setGames(activeGames);

      const activePosts = await api.getPosts();
      setPosts(activePosts);
    } catch (err) {
      console.error("System boot up data pull failed", err);
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshFeed = async () => {
    try {
      const activePosts = await api.getPosts();
      setPosts(activePosts);
    } catch (e) {
      console.error("Feed refresh failed", e);
    }
  };

  const refreshGames = async () => {
    try {
      const activeGames = await api.getGames();
      setGames(activeGames);
    } catch (e) {
      console.error("Games refresh failed", e);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setActiveUser(user);
    // Refresh all collections to adapt comments/likes to active user
    loadInitialData();
  };

  const handleLogout = () => {
    if (!window.confirm("¿Deseas cerrar la sesión activa?")) return;
    localStorage.removeItem("gaming_social_user_id");
    setActiveUser(null);
    setCurrentTab("feed");
    setSelectedGameId(null);
    setSelectedProfileId(null);
  };

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setSelectedProfileId(null);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedProfileId(userId);
    setSelectedGameId(null);
    setCurrentTab("profile"); // Swaps profile tab
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-[#0B0D13] flex flex-col items-center justify-center text-zinc-400 font-mono text-xs space-y-4">
        <div className="relative">
          <Gamepad2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
        <p className="animate-pulse">COOTSTRAPPING CENTRAL GATEWAY SECURE DATABASE...</p>
      </div>
    );
  }

  return (
    <div id="applet-viewport" className="min-h-screen bg-[#07080C] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Dynamic gamer grid header */}
      <header className="sticky top-0 z-50 bg-[#0B0D13]/90 backdrop-blur-md border-b border-zinc-900/80 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo brand */}
          <button
            onClick={() => {
              setSelectedGameId(null);
              setSelectedProfileId(null);
              setCurrentTab("feed");
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="p-2 bg-indigo-505/20 border border-indigo-500/40 text-cyan-400 rounded-xl">
              <Gamepad2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight text-white flex items-center gap-1">
                GAMERVERSE <span className="text-[10px] font-mono py-0.5 px-1 bg-cyan-950/40 text-cyan-400 border border-cyan-850/60 rounded">SOCiAL</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider">LA RED EXCLUSIVA DE VIDEOJUEGOS</p>
            </div>
          </button>

          {activeUser && (
            <>
              {/* Navigation Tabs - Hidden on mobile, sticky bottom layout handles small screens */}
              <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setSelectedGameId(null);
                    setSelectedProfileId(null);
                    setCurrentTab("feed");
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                    currentTab === "feed" && !selectedGameId && !selectedProfileId
                      ? "bg-zinc-900 text-white border border-zinc-800"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> Muro Social
                </button>

                <button
                  onClick={() => {
                    setSelectedGameId(null);
                    setSelectedProfileId(null);
                    setCurrentTab("games");
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                    currentTab === "games" || selectedGameId
                      ? "bg-zinc-900 text-white border border-zinc-800"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" /> Base de Datos
                </button>

                <button
                  onClick={() => {
                    setSelectedGameId(null);
                    setSelectedProfileId(activeUser.id);
                    setCurrentTab("profile");
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                    currentTab === "profile" && selectedProfileId === activeUser.id
                      ? "bg-zinc-900 text-white border border-zinc-800"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Users className="w-4 h-4" /> Mi Perfil
                </button>
              </nav>

              {/* User Session Switcher / User Logged badge */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-zinc-250 flex items-center gap-1">
                    🟢 {activeUser.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">@{activeUser.username}</span>
                </div>

                <div className="relative shrink-0 group">
                  <img
                    src={activeUser.avatarUrl}
                    alt={activeUser.username}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border-2 border-zinc-800 group-hover:border-cyan-400 transition"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-zinc-900 text-zinc-550 hover:text-rose-400 rounded-xl transition"
                  title="Cerrar sesión gamer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main application chassis */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 pb-24 sm:pb-8">
        {!activeUser ? (
          <div className="py-8 flex items-center justify-center">
            <AuthModal
              onSuccess={handleLoginSuccess}
              allUsers={allUsers}
              onRefreshUsers={loadInitialData}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Split routing panels */}
            {selectedGameId ? (
              <GameDetails
                gameId={selectedGameId}
                activeUser={activeUser}
                onBack={() => setSelectedGameId(null)}
                onRefreshGames={refreshGames}
                onSelectUser={handleSelectUser}
              />
            ) : selectedProfileId ? (
              <UserProfile
                userId={selectedProfileId}
                activeUser={activeUser}
                onUpdateActiveUser={(updated) => setActiveUser(updated)}
                onSelectGame={handleSelectGame}
                onRefreshFeed={refreshFeed}
              />
            ) : (
              <>
                {currentTab === "feed" && (
                  <Dashboard
                    activeUser={activeUser}
                    posts={posts}
                    games={games}
                    onRefreshFeed={refreshFeed}
                    onSelectGame={handleSelectGame}
                    onSelectUser={handleSelectUser}
                  />
                )}

                {currentTab === "games" && (
                  <GameCatalog
                    games={games}
                    onSelectGame={handleSelectGame}
                    onRefreshGames={refreshGames}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Cyber Mobile sticky game hub dock - active under sm breakpoint */}
      {activeUser && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0D13]/95 backdrop-blur-lg border-t border-zinc-800 px-4 py-2 flex justify-around items-center rounded-t-2xl shadow-[0_-8px_30px_rgb(0,0,0)] pb-safe">
          <button
            onClick={() => {
              setSelectedGameId(null);
              setSelectedProfileId(null);
              setCurrentTab("feed");
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 ${
              currentTab === "feed" && !selectedGameId && !selectedProfileId
                ? "text-cyan-400 scale-105 font-bold"
                : "text-zinc-400"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold font-mono tracking-tighter">MURO</span>
          </button>

          <button
            onClick={() => {
              setSelectedGameId(null);
              setSelectedProfileId(null);
              setCurrentTab("games");
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 ${
              currentTab === "games" || selectedGameId
                ? "text-cyan-400 scale-105 font-bold"
                : "text-zinc-400"
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-[10px] font-bold font-mono tracking-tighter">BASE</span>
          </button>

          <button
            onClick={() => {
              setSelectedGameId(null);
              setSelectedProfileId(activeUser.id);
              setCurrentTab("profile");
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 ${
              currentTab === "profile" && selectedProfileId === activeUser.id
                ? "text-cyan-400 scale-105 font-bold"
                : "text-zinc-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold font-mono tracking-tighter">PERFIL</span>
          </button>
        </div>
      )}

      {/* Cyber Gamer footer */}
      <footer className="mt-12 bg-[#0B0D13] border-t border-zinc-900 py-6 text-center text-zinc-650 font-mono text-[10px] tracking-wide pb-28 sm:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>🎮 GAMERVERSE NETWORK &copy; {new Date().getFullYear()} - Creado con React y Gemini AI</p>
          <div className="flex items-center gap-1">
            <span>SISTEMA DE BASE DE DATOS:</span>
            <span className="text-cyan-400 font-bold bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-850/60 uppercase">
              Gemini AI Auto-Indexing Enabled
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
