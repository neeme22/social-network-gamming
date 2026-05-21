import React, { useState, useEffect } from "react";
import { User, Post, Game } from "../types";
import { api } from "../api";
import { motion, AnimatePresence } from "motion/react";
import { calculateGamerStats } from "../utils/gamerUtils";
import {
  Gamepad2,
  Heart,
  MessageSquare,
  Send,
  Trash2,
  Image,
  Sparkles,
  Link2,
  X,
  Plus,
  Compass,
  Users,
  Flame,
  Award,
  TrendingUp
} from "lucide-react";

interface DashboardProps {
  activeUser: User;
  posts: Post[];
  games: Game[];
  onRefreshFeed: () => void;
  onSelectGame: (gameId: string) => void;
  onSelectUser: (userId: string) => void;
}

export default function Dashboard({
  activeUser,
  posts,
  games,
  onRefreshFeed,
  onSelectGame,
  onSelectUser
}: DashboardProps) {
  const [content, setContent] = useState("");
  const [taggedGameId, setTaggedGameId] = useState("");
  const [selectedPresetImage, setSelectedPresetImage] = useState<string | null>(null);
  const [showImagePresets, setShowImagePresets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedMode, setFeedMode] = useState<"global" | "squad">("global");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [suggestedGamers, setSuggestedGamers] = useState<User[]>([]);
  
  // High-fidelity active interactive gamified particles state
  const [likeBursts, setLikeBursts] = useState<Array<{ id: number; postId: string; angle: number; distance: number; emoji: string }>>([]);

  // Fetch following list to enable "Mi Squad" filter
  useEffect(() => {
    const loadSquadList = async () => {
      try {
        const detail = await api.getUserDetail(activeUser.id);
        setFollowingIds(detail.following || []);
      } catch (err) {
        console.warn("Could not fetch active user squad following list", err);
      }
    };
    if (activeUser && activeUser.id) {
      loadSquadList();
    }
  }, [activeUser.id, posts]);

  // Load suggested gamers sidebar list
  useEffect(() => {
    const loadGamersList = async () => {
      try {
        const list = await api.getAllUsers();
        setSuggestedGamers(list.filter(u => u.id !== activeUser.id).slice(0, 4));
      } catch (err) {
        console.warn("Could not load suggested gamers", err);
      }
    };
    loadGamersList();
  }, [activeUser.id]);

  // Comment input per-post tracking
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // AI Gamer Oracle states
  const [oracleQuery, setOracleQuery] = useState("");
  const [oracleMessages, setOracleMessages] = useState<Array<{ sender: "user" | "oracle"; text: string }>>([
    { sender: "oracle", text: "👾 **¡Hola, leyenda!** Soy el **Oráculo Gamer AI**. ¿Qué lore, truco, build competitiva o recomendación de juego estás buscando hoy?" }
  ]);
  const [oracleLoading, setOracleLoading] = useState(false);

  const handleAskOracle = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = customPrompt || oracleQuery;
    if (!query.trim() || oracleLoading) return;

    // Save prompt
    setOracleQuery("");
    setOracleMessages(prev => [...prev, { sender: "user", text: query }]);
    setOracleLoading(true);

    try {
      const res = await api.askGamerOracle(query);
      setOracleMessages(prev => [...prev, { sender: "oracle", text: res.text }]);
    } catch (err) {
      setOracleMessages(prev => [
        ...prev,
        { sender: "oracle", text: "❌ Lo siento, la conexión con el servidor del Oráculo se ha caído. Recuerda que puedes reintentar o configurar tu `GEMINI_API_KEY` en secrets para respuestas reales." }
      ]);
    } finally {
      setOracleLoading(false);
    }
  };

  const presetImages = [
    { title: "Epic Battle RT", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop" },
    { title: "Retro Joystick", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop" },
    { title: "Fantasy World", url: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=600&auto=format&fit=crop" },
    { title: "Gaming Setup RGB", url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop" }
  ];

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedPresetImage) return;

    setLoading(true);
    try {
      let gameTitle = undefined;
      if (taggedGameId) {
        const found = games.find(g => g.id === taggedGameId);
        if (found) {
          gameTitle = found.title;
        }
      }

      await api.createPost({
        content: content.trim(),
        imageUrl: selectedPresetImage || undefined,
        gameId: taggedGameId || undefined,
        gameTitle
      });

      setContent("");
      setTaggedGameId("");
      setSelectedPresetImage(null);
      setShowImagePresets(false);
      onRefreshFeed();
    } catch (err) {
      console.error("Failed to share new gaming state", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    const postObj = posts.find(p => p.id === postId);
    const isLiking = postObj ? !postObj.likes.includes(activeUser.id) : true;

    if (isLiking) {
      // Spawn 8 playful physical particle vectors for micro-interactions
      const emojis = ["❤️", "🔥", "✨", "👾", "⚡", "⭐", "🎯", "👑"];
      const newBurst = Array.from({ length: 8 }).map((_, idx) => {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        return {
          id: Math.random() + Date.now(),
          postId,
          angle: (idx * 360) / 8 + (Math.random() * 20 - 10), // distributed circle dispersion
          distance: 45 + Math.random() * 40,
          emoji: randomEmoji
        };
      });
      setLikeBursts(prev => [...prev, ...newBurst]);
      
      // Garbage collect individual particles after animation duration
      setTimeout(() => {
        setLikeBursts(prev => prev.filter(p => !newBurst.some(nb => nb.id === p.id)));
      }, 1000);
    }

    try {
      await api.toggleLike(postId);
      onRefreshFeed();
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const txt = commentInputs[postId];
    if (!txt || !txt.trim()) return;

    try {
      await api.addComment(postId, txt.trim());
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      onRefreshFeed();
    } catch (err) {
      console.error("Failed to post comment reply", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación del muro?")) return;
    try {
      await api.deletePost(postId);
      onRefreshFeed();
    } catch (err) {
      console.error("Could not delete post", err);
    }
  };

  const displayedPosts = posts.filter(post => {
    if (feedMode === "squad") {
      return post.userId === activeUser.id || followingIds.includes(post.userId);
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Social Posts Main Feed column */}
      <div className="lg:col-span-2 space-y-6">
        {/* State publisher composer box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex gap-4">
            <img
              src={activeUser.avatarUrl}
              alt={activeUser.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-zinc-800"
            />
            <div className="flex-grow">
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <textarea
                  placeholder="¿A qué estás jugando hoy? ¡Comparte un truco, un logro o un clip!"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent border-0 resize-none text-zinc-100 placeholder-zinc-500 font-sans text-sm focus:outline-none focus:ring-0"
                />

                {selectedPresetImage && (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800/80 max-h-48 group">
                    <img src={selectedPresetImage} alt="State artwork preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSelectedPresetImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/85 hover:bg-black text-rose-400 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Tagged game indicator preview */}
                {taggedGameId && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-indigo-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4" /> Etiquetado: {games.find(g => g.id === taggedGameId)?.title || taggedGameId}
                    </span>
                    <button type="button" onClick={() => setTaggedGameId("")} className="text-zinc-500 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-850/80">
                  <div className="flex items-center gap-2">
                    {/* Add visual presets toggle */}
                    <button
                      type="button"
                      onClick={() => setShowImagePresets(!showImagePresets)}
                      className="p-2 bg-zinc-950 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-850 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Image className="w-4 h-4" /> Adjuntar Captura
                    </button>

                    {/* Tag game selection picker */}
                    <div className="relative">
                      <select
                        value={taggedGameId}
                        onChange={(e) => setTaggedGameId(e.target.value)}
                        className="p-2 bg-zinc-950 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-850 rounded-xl transition text-xs font-semibold border-0 focus:outline-none cursor-pointer"
                      >
                        <option value="">🏷️ Taggear Videojuego</option>
                        {games.map(g => (
                          <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (!content.trim() && !selectedPresetImage)}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium text-xs rounded-xl shadow-md hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    Publicar <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Show preset galleries if toggled */}
              <AnimatePresence>
                {showImagePresets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-zinc-900/60"
                  >
                    <p className="text-xs text-zinc-500 font-mono mb-2">SELECCIÓNA UNA CAPTURA GAMEPLAY PRESET:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {presetImages.map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => { setSelectedPresetImage(img.url); setShowImagePresets(false); }}
                          className="relative h-16 rounded-lg overflow-hidden border border-zinc-850 hover:border-cyan-400 transition"
                        >
                          <img src={img.url} alt={img.title} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-75 hover:opacity-100" />
                          <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-zinc-100 bg-black/70 px-1 py-0.5 rounded">
                            {img.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Toggle feed mode subcategories */}
        <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <button
            onClick={() => setFeedMode("global")}
            className={`flex-1 py-3 text-xs font-bold font-mono transition justify-center flex items-center gap-2 rounded-xl border ${
              feedMode === "global"
                ? "bg-zinc-950 border-zinc-800 text-cyan-400 font-extrabold shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
                : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Compass className="w-4 h-4" /> DESCUBRIR (GLOBAL)
          </button>
          
          <button
            onClick={() => setFeedMode("squad")}
            className={`flex-1 py-3 text-xs font-bold font-mono transition justify-center flex items-center gap-2 rounded-xl border ${
              feedMode === "squad"
                ? "bg-zinc-950 border-zinc-800 text-indigo-400 font-extrabold shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
                : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users className="w-4 h-4" /> SQUAD DE AMIGOS
          </button>
        </div>

        {/* Posts wall container */}
        <div className="space-y-4">
          {displayedPosts.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 font-mono">
              <Gamepad2 className="w-12 h-12 text-zinc-750 mx-auto mb-3 animate-pulse" />
              <p className="text-sm">
                {feedMode === "squad" 
                  ? "Aún no sigues a nadie con publicaciones, o tu squad está inactivo. ¡Busca perfiles y dales a Seguir!" 
                  : "¡El muro está vacío! Escribe la primera publicación para animar la comunidad."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayedPosts.map((post) => {
                const isLikedByMe = post.likes.includes(activeUser.id);
                const isMyPost = post.userId === activeUser.id;

                const pseudoUser: User = {
                  id: post.userId,
                  name: post.username,
                  username: post.username,
                  email: "",
                  avatarUrl: post.userAvatar,
                  bannerUrl: "",
                  bio: "",
                  favoritePlatforms: [],
                  createdAt: ""
                };
                const writerStats = calculateGamerStats(pseudoUser, posts, [], 0);

                return (
                  <motion.div
                    key={post.id}
                    layoutId={`post-card-${post.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow"
                  >
                    {/* Post Author info line */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onSelectUser(post.userId)}
                          className="relative flex-shrink-0 group"
                        >
                          <img
                            src={post.userAvatar}
                            alt={post.username}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-zinc-800 group-hover:border-cyan-400 transition"
                          />
                        </button>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => onSelectUser(post.userId)}
                              className="text-sm font-bold text-zinc-150 hover:text-cyan-400 transition text-left"
                            >
                              {post.username}
                            </button>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-505/10 border border-indigo-500/20 text-indigo-400 font-extrabold flex items-center shrink-0">
                              LV.{writerStats.level}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-550 font-mono">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isMyPost && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 hover:bg-zinc-950 text-zinc-650 hover:text-rose-400 rounded-lg transition"
                          title="Eliminar publicación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Sub content description info */}
                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {/* Optional Tagged Game link */}
                    {post.gameId && (
                      <div className="flex">
                        <button
                          onClick={() => onSelectGame(post.gameId!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-950 hover:bg-zinc-850 hover:border-indigo-500 transition border border-zinc-850/80 rounded-lg text-xs text-indigo-400 font-mono"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" /> Tagged Game: {post.gameTitle}
                        </button>
                      </div>
                    )}

                    {/* Post Content Cover */}
                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-zinc-850/80 max-h-96">
                        <img src={post.imageUrl} alt="Contenido social" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    )}

                     {/* Social feedback actions */}
                     <div className="flex items-center gap-6 pt-1 text-zinc-400 border-t border-zinc-850/30">
                       <motion.button
                         whileTap={{ scale: 0.85 }}
                         whileHover={{ scale: 1.05 }}
                         onClick={() => handleLikeToggle(post.id)}
                         className={`relative flex items-center gap-1.5 text-xs font-semibold font-mono transition group select-none px-1 py-0.5 ${
                           isLikedByMe ? "text-rose-400" : "hover:text-rose-400 text-zinc-400"
                         }`}
                       >
                         {/* Dynamic Like Explosion Sparks */}
                         <AnimatePresence>
                           {likeBursts
                             .filter((b) => b.postId === post.id)
                             .map((p) => (
                               <motion.span
                                 key={p.id}
                                 initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                                 animate={{
                                   x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                                   y: Math.sin((p.angle * Math.PI) / 180) * p.distance - 12,
                                   scale: [0.6, 1.5, 0.9, 0],
                                   opacity: [1, 1, 0.8, 0],
                                   rotate: [0, 45, 90, 180]
                                 }}
                                 exit={{ opacity: 0 }}
                                 transition={{ duration: 0.9, ease: "easeOut" }}
                                 className="absolute pointer-events-none text-base select-none drop-shadow-[0_0_10px_rgba(244,63,94,0.9)] z-50 text-center flex items-center justify-center left-4 top-1"
                               >
                                 {p.emoji}
                               </motion.span>
                             ))}
                         </AnimatePresence>

                         <Heart
                           className={`w-4 h-4 transition-all duration-300 ${
                             isLikedByMe 
                               ? "fill-current text-rose-500 scale-125 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" 
                               : "group-hover:scale-115 text-zinc-400"
                           }`}
                         />
                         <span className={isLikedByMe ? "text-rose-450 font-extrabold" : ""}>
                           {post.likes.length} Likes
                         </span>
                       </motion.button>

                       <div className="flex items-center gap-1.5 text-xs font-semibold font-mono text-zinc-400">
                         <MessageSquare className="w-4 h-4 text-cyan-400" />
                         <span>{post.comments.length} Comentarios</span>
                       </div>
                     </div>

                    {/* Nested comments layout */}
                    <div className="space-y-3 pt-3 border-t border-zinc-850/30">
                      {post.comments.length > 0 && (
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {post.comments.map((comm) => {
                            const commenterPseudo: User = {
                              id: comm.userId,
                              name: comm.username,
                              username: comm.username,
                              email: "",
                              avatarUrl: comm.userAvatar,
                              bannerUrl: "",
                              bio: "",
                              favoritePlatforms: [],
                              createdAt: ""
                            };
                            const commenterStats = calculateGamerStats(commenterPseudo, posts, [], 0);

                            return (
                              <div key={comm.id} className="flex gap-2.5 items-start text-xs bg-zinc-950/40 border border-zinc-850/40 p-2.5 rounded-xl">
                                <button onClick={() => onSelectUser(comm.userId)}>
                                  <img
                                    src={comm.userAvatar}
                                    alt={comm.username}
                                    referrerPolicy="no-referrer"
                                    className="w-7 h-7 rounded-full object-cover border border-zinc-800 hover:border-cyan-400 transition"
                                  />
                                </button>
                                <div className="flex-grow">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => onSelectUser(comm.userId)}
                                        className="font-bold text-zinc-250 hover:text-cyan-400 transition text-left"
                                      >
                                        {comm.username}
                                      </button>
                                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-850/60 text-indigo-400 font-bold">
                                        LV.{commenterStats.level}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-zinc-500 font-mono">
                                      {new Date(comm.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-zinc-350 mt-0.5 leading-relaxed font-sans">{comm.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add comment reply bar */}
                      <form
                        onSubmit={(e) => handleCommentSubmit(e, post.id)}
                        className="flex gap-2 items-center"
                      >
                        <input
                          type="text"
                          placeholder="Escribe un comentario o un saludo gamer..."
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                          }
                          className="flex-grow bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-250 placeholder-zinc-650 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="submit"
                          disabled={!(commentInputs[post.id] || "").trim()}
                          className="p-2.5 bg-zinc-800 hover:bg-cyan-500 hover:text-white rounded-xl text-zinc-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Social Sidebar Connections column */}
      <div className="lg:col-span-1 space-y-6">
        {/* Suggested Gamers list panel */}
        {suggestedGamers.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-950 pb-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" /> Descubrir Jugadores
              </h3>
            </div>

            <div className="space-y-4">
              {suggestedGamers.map((gamer) => {
                const gamerStats = calculateGamerStats(gamer, posts, [], 0);
                return (
                  <div key={gamer.id} className="flex items-center justify-between gap-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60">
                    <button 
                      onClick={() => onSelectUser(gamer.id)}
                      className="flex items-center gap-2.5 text-left group overflow-hidden"
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={gamer.avatarUrl} 
                          alt={gamer.username} 
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-zinc-800 group-hover:border-cyan-400 transition"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition truncate">{gamer.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">@{gamer.username}</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => onSelectUser(gamer.id)}
                      className="text-[9px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-850 hover:border-indigo-500 text-indigo-400 font-extrabold shrink-0"
                    >
                      VER PERFIL
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Oráculo Gamer AI widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between pb-1 border-b border-zinc-950 pb-2">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> Oráculo Gamer (IA)
            </h3>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/30 text-cyan-400 border border-cyan-800/40 uppercase font-bold tracking-wider animate-pulse">Online</span>
          </div>

          {/* Quick recommendations chips */}
          <div className="flex flex-wrap gap-1">
            {[
              "¿RPG recomendado?",
              "Build OP Samurai Elden",
              "Truco pro en Sekiro"
            ].map((suggestedPrompt, idx) => (
              <button
                key={idx}
                onClick={() => handleAskOracle(undefined, suggestedPrompt)}
                disabled={oracleLoading}
                className="text-[10px] bg-zinc-950/80 hover:bg-zinc-950 text-zinc-400 hover:text-white px-2 py-1 rounded-lg border border-zinc-850/80 hover:border-zinc-805 text-left transition select-none disabled:opacity-50"
              >
                {suggestedPrompt}
              </button>
            ))}
          </div>

          <div className="max-h-48 overflow-y-auto bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 space-y-3.5 custom-scrollbar text-xs font-sans">
            {oracleMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-xl border text-[11px] leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-950/15 border-indigo-900/40 text-zinc-200 ml-4"
                    : "bg-zinc-900/60 border-zinc-850 text-zinc-300 mr-4"
                }`}
              >
                <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5 text-zinc-500">
                  {msg.sender === "user" ? "Tú" : "Oráculo Gamer"}
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ))}

            {oracleLoading && (
              <div className="flex items-center gap-2 p-1 text-zinc-400 font-mono text-[10px] animate-pulse">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                <span>Invocando respuestas del Oráculo...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAskOracle} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Pregúntale al sabio de los juegos..."
              value={oracleQuery}
              onChange={(e) => setOracleQuery(e.target.value)}
              disabled={oracleLoading}
              className="flex-grow bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-250 placeholder-zinc-650 focus:outline-none focus:border-cyan-550 disabled:opacity-50 font-sans"
            />
            <button
              type="submit"
              disabled={oracleLoading || !oracleQuery.trim()}
              className="px-3 bg-gradient-to-r from-indigo-505 to-cyan-500 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center justify-center transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              Consultar
            </button>
          </form>
        </div>

        {/* Hot games catalog widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-950 pb-2">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" /> Tendencias de la Semana
            </h3>
          </div>

          <div className="space-y-3.5">
            {games.slice(0, 3).map((game) => (
              <div key={game.id} className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850/60 flex items-center gap-3">
                <img
                  src={game.coverUrl}
                  alt={game.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-14 object-cover rounded-lg border border-zinc-800 shrink-0"
                />
                <div className="flex-grow overflow-hidden">
                  <button
                    onClick={() => onSelectGame(game.id)}
                    className="text-xs font-bold text-white hover:text-cyan-400 transition text-left truncate w-full block"
                  >
                    {game.title}
                  </button>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{game.developer}</p>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px]">
                    <span className="text-amber-400 font-semibold flex items-center gap-0.5">🌟 {game.ratingAverage || "New"}</span>
                    <span className="text-zinc-650">({game.ratingsCount} reviews)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              const gameIds = ["elden-ring", "cyberpunk-2077", "the-legend-of-zelda-tears-of-the-kingdom", "baldurs-gate-3"];
              const randomGame = gameIds[Math.floor(Math.random() * gameIds.length)];
              onSelectGame(randomGame);
            }}
            className="w-full text-center py-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition block border-t border-zinc-850 pt-3"
          >
            VER CATÁLOGO ENTERO &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
