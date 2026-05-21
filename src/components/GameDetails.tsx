import React, { useState, useEffect } from "react";
import { Game, Review, User } from "../types";
import { api } from "../api";
import { Star, Gamepad2, Calendar, LayoutGrid, CheckCircle2, Award, Sparkles, AlertCircle, Trash2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface GameDetailsProps {
  gameId: string;
  activeUser: User;
  onBack: () => void;
  onRefreshGames: () => void;
  onSelectUser: (userId: string) => void;
}

export default function GameDetails({
  gameId,
  activeUser,
  onBack,
  onRefreshGames,
  onSelectUser
}: GameDetailsProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Review editor state
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [gameplayStatus, setGameplayStatus] = useState<Review["status"]>("Playing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadGameData = async () => {
    try {
      const g = await api.getGameById(gameId);
      setGame(g);
      const revs = await api.getReviews({ gameId });
      setReviews(revs);
    } catch (err) {
      console.error("Could not load game and reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameData();
  }, [gameId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !reviewText.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    try {
      await api.createReview({
        gameId: game.id,
        gameTitle: game.title,
        gameCover: game.coverUrl,
        rating,
        content: reviewText.trim(),
        status: gameplayStatus
      });

      setReviewText("");
      setSuccessMsg("¡Tu reseña y valoración se han publicado correctamente en el muro!");
      onRefreshGames();
      loadGameData(); // Reload stats and scores

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to commit review", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar tu reseña?")) return;
    try {
      await api.deleteReview(reviewId);
      onRefreshGames();
      loadGameData();
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  if (loading || !game) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400 font-mono text-xs">
        <Gamepad2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <span>Sincronizando ficha técnica y valoraciones con la IA...</span>
      </div>
    );
  }

  const getStatusLabelText = (status: Review["status"]) => {
    switch (status) {
      case "Playing": return "Jugando actualmente";
      case "Completed": return "Completado al 100%";
      case "Abandoned": return "Abandonado / En pausa";
      case "Wishlist": return "En lista de deseos";
      default: return status;
    }
  };

  const getStatusColor = (status: Review["status"]) => {
    switch (status) {
      case "Playing": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "Completed": return "bg-cyan-500/10 text-cyan-400 border border-cyan-400/35";
      case "Abandoned": return "bg-red-500/10 text-red-400 border border-red-500/30";
      case "Wishlist": return "bg-amber-500/10 text-amber-500 border border-amber-500/30";
      default: return "bg-zinc-850 text-zinc-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to list button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white transition uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </button>
      </div>

      {/* Hero card section & stats split layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left pane: Game Cover Art & Technical Specs */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 flex flex-col items-center text-center space-y-4">
            <div className="w-48 h-64 sm:w-56 sm:h-76 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
              <img
                src={game.coverUrl}
                alt={game.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full">
              <h2 className="text-lg font-bold text-white tracking-tight">{game.title}</h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{game.developer}</p>
            </div>

            {/* Score Showcase */}
            <div className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-850/80 flex justify-between items-center text-left">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block">Nota Media</span>
                <span className="text-2xl font-black text-white font-mono flex items-center gap-1.5 mt-0.5">
                  🌟 {game.ratingAverage || "New"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block">Muestras</span>
                <span className="text-sm font-bold text-zinc-300 font-mono block mt-1">
                  {game.ratingsCount} reseñas
                </span>
              </div>
            </div>

            {/* Technical Specifications list */}
            <div className="w-full text-left pt-2 space-y-3.5 border-t border-zinc-850/60">
              <div className="text-xs">
                <span className="font-mono text-zinc-500 uppercase block tracking-wider mb-1">Publicación original</span>
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" /> {new Date(game.releaseDate).toLocaleDateString("es-ES", { dateStyle: "long" })}
                </span>
              </div>

              <div className="text-xs">
                <span className="font-mono text-zinc-500 uppercase block tracking-wider mb-1">Géneros</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {game.genre.map((gen) => (
                    <span key={gen} className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] rounded text-zinc-400">
                      {gen}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs">
                <span className="font-mono text-zinc-500 uppercase block tracking-wider mb-1">Plataformas Disponibles</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {game.platforms.map((plat) => (
                    <span key={plat} className="px-2 py-0.5 bg-indigo-950/20 border border-indigo-900/40 text-[10px] rounded text-indigo-400">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Narrative summary and review forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#9EA6BC] flex items-center gap-1.5 pb-2 border-b border-zinc-850/60">
              <Award className="w-4 h-4 text-indigo-400" /> Sinopsis e Historia del Título
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans whitespace-pre-line">{game.description}</p>
          </div>

          {/* User Review Submitter */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-550/5 rounded-full blur-2xl pointer-events-none" />

            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-200 flex items-center gap-1.5 pb-2 border-b border-zinc-850/60">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Agregar mi Valoración Gamer
            </h3>

            {successMsg && (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-850/60 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Score Stars */}
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">Tu Puntuación (Estrellas)</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        className="p-1 hover:scale-110 transition rounded focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            starNum <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">Estado actual de juego</label>
                  <div className="relative">
                    <select
                      value={gameplayStatus}
                      onChange={(e) => setGameplayStatus(e.target.value as Review["status"])}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Playing">🟢 Jugando actualmente</option>
                      <option value="Completed">🏆 Completado al 100%</option>
                      <option value="Abandoned">⏸️ Abandonado / En pausa</option>
                      <option value="Wishlist">💛 En lista de deseos</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">Análisis / Reseña escrita</label>
                <textarea
                  rows={4}
                  placeholder="Detalla tus sensaciones, opinión de mecánicas, sonido, música, o qué te pareció el final..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 placeholder-zinc-650"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !reviewText.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-505 to-cyan-500 hover:opacity-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50"
                >
                  Publicar Reseña & Puntuación
                </button>
              </div>
            </form>
          </div>

          {/* Social Reviews List feed */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#9EA6BC] flex items-center gap-2">
              Análisis de la Comunidad ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
                Aún no hay reseñas escritas para este juego. ¡Sé el primero en compartir la tuya!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => {
                  const isMyReview = rev.userId === activeUser.id;
                  return (
                    <div key={rev.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onSelectUser(rev.userId)}
                            className="flex-shrink-0 group"
                          >
                            <img
                              src={rev.userAvatar}
                              alt={rev.username}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full border border-zinc-800 group-hover:border-cyan-400 transition object-cover"
                            />
                          </button>
                          <div>
                            <button
                              onClick={() => onSelectUser(rev.userId)}
                              className="text-xs font-bold text-white hover:text-cyan-400 transition"
                            >
                              {rev.username}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(rev.status)}`}>
                                {getStatusLabelText(rev.status)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-400 font-mono text-xs gap-1.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-800"
                                }`}
                              />
                            ))}
                          </div>

                          {isMyReview && (
                            <button
                              onClick={() => handleDeleteReview(rev.id)}
                              className="p-1.5 hover:bg-zinc-950 text-zinc-650 hover:text-rose-400 rounded-lg transition"
                              title="Borrar mi reseña"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-zinc-300 text-sm leading-relaxed font-sans pt-1 whitespace-pre-wrap">
                        "{rev.content}"
                      </p>

                      <div className="text-[10px] font-mono text-zinc-550 text-right">
                        Publicado: {new Date(rev.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
