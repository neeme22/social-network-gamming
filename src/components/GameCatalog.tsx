import React, { useState } from "react";
import { Game } from "../types";
import { api } from "../api";
import { Search, Gamepad2, Plus, ArrowRight, Star, Disc, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface GameCatalogProps {
  games: Game[];
  onSelectGame: (gameId: string) => void;
  onRefreshGames: () => void;
}

export default function GameCatalog({ games, onSelectGame, onRefreshGames }: GameCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Game[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    setAiSuccess(false);
    try {
      const results = await api.searchGames(searchQuery);
      setSearchResults(results);
      onRefreshGames();
      if (results.length === 1 && !games.some(g => g.id === results[0].id)) {
        setAiSuccess(true);
      }
    } catch (err) {
      console.error("Failed to query catalog", err);
    } finally {
      setLoading(false);
    }
  };

  const activeCollection = searchResults !== null ? searchResults : games;

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-505/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl space-y-3">
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            Catálogo e Base de Datos Inteligente <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          </h2>
          <p className="text-xs text-zinc-400">
            Busca cualquier videojuego de consolas o PC. Si no existe en nuestra red, nuestra IA de Gemini recabará y auto-creará su ficha técnica en tiempo real.
          </p>

          <form onSubmit={handleSearchSubmit} className="pt-2 flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Busca por título o género (ej. Elden Ring, Baldur's Gate, Terror...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-0 pl-10 font-mono"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              Buscar
            </button>
          </form>

          {searchResults !== null && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults(null); }}
              className="text-[10px] font-mono text-zinc-500 hover:text-white transition uppercase tracking-widest block pt-1"
            >
              &larr; Limpiar búsqueda y ver todo
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-400 font-mono text-xs space-y-4">
          <div className="relative">
            <Disc className="w-12 h-12 text-cyan-400 animate-spin" />
            <Gamepad2 className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
          </div>
          <p className="animate-pulse">Gemini IA está indexando las portadas, sinopsis y desarrolladores de tu juego...</p>
        </div>
      )}

      {aiSuccess && !loading && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-850/60 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" /> ¡El juego ha sido invocado dinámicamente de forma exitosa mediante Inteligencia Artificial!
        </div>
      )}

      {!loading && (
        <>
          {activeCollection.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-12 text-center text-zinc-500 font-mono text-xs">
              <XSearchWarn onSeedSearch={(q) => { setSearchQuery(q); }} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {activeCollection.map((game, idx) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  whileHover={{ y: -6 }}
                  className="bg-zinc-900 border border-zinc-800 hover:border-cyan-500/80 rounded-2xl overflow-hidden flex flex-col shadow group transition-all duration-300"
                >
                  <div
                    onClick={() => onSelectGame(game.id)}
                    className="h-48 sm:h-56 relative overflow-hidden cursor-pointer bg-zinc-950"
                  >
                    <img
                      src={game.coverUrl}
                      alt={game.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

                    {game.ratingAverage > 0 && (
                      <div className="absolute top-2.5 right-2.5 bg-zinc-900/85 backdrop-blur-md px-1.5 py-1 rounded text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {game.ratingAverage}
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-[#9EA6BC] block mb-0.5">
                        {game.genre[0] || "Acción"}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-tight font-sans truncate">
                        {game.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <p className="text-zinc-400 text-[10px] font-mono line-clamp-2">
                      Estudio: {game.developer}
                    </p>

                    <button
                      onClick={() => onSelectGame(game.id)}
                      className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 hover:text-white text-zinc-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 border border-zinc-850/80 group-hover:border-indigo-500"
                    >
                      Ampliar Ficha <ArrowRight className="w-3.5 h-3.5 text-zinc-550 group-hover:text-cyan-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function XSearchWarn({ onSeedSearch }: { onSeedSearch: (q: string) => void }) {
  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <Gamepad2 className="w-10 h-10 text-zinc-700 mx-auto" />
      <p>No encontramos videojuegos que coincidan con tu búsqueda en caché.</p>
      <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl text-left space-y-2">
        <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">¿Deseas invocar un título real?</p>
        <p className="text-[11px] text-zinc-500 font-sans">Escribe el nombre de un juego popular que no esté en la base y presiona Buscar. ¡Nuestra API con IA de Gemini lo creará en segundos!</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {["Resident Evil 4", "Hollow Knight", "Grand Theft Auto V"].map((pop) => (
            <button
              key={pop}
              onClick={() => onSeedSearch(pop)}
              className="px-2 py-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/20 rounded border border-cyan-850 hover:bg-cyan-950/40"
            >
              {pop}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
