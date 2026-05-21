import React, { useState, useEffect } from "react";
import { User, Post, Review } from "../types";
import { api } from "../api";
import { calculateGamerStats, getGamerAchievements } from "../utils/gamerUtils";
import {
  Calendar,
  Gamepad2,
  Users,
  MessageSquare,
  Star,
  Edit3,
  Check,
  UserCheck,
  UserPlus,
  Play,
  Heart,
  Share2,
  Award,
  Lock,
  Zap,
  CheckCircle2
} from "lucide-react";

interface UserProfileProps {
  userId: string;
  activeUser: User;
  onUpdateActiveUser: (user: User) => void;
  onSelectGame: (gameId: string) => void;
  onRefreshFeed: () => void;
}

export default function UserProfile({
  userId,
  activeUser,
  onUpdateActiveUser,
  onSelectGame,
  onRefreshFeed
}: UserProfileProps) {
  const [profileData, setProfileData] = useState<{
    user: User;
    posts: Post[];
    reviews: Review[];
    followers: string[];
    following: string[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reviews">("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = activeUser.id === userId;

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getUserDetail(userId);
      setProfileData(data);
      setIsFollowing(data.followers.includes(activeUser.id));

      // Prep edit fields
      setEditName(data.user.name);
      setEditBio(data.user.bio || "");
      setEditAvatar(data.user.avatarUrl);
      setEditBanner(data.user.bannerUrl);
      setEditPlatforms(data.user.favoritePlatforms || []);
    } catch (err) {
      console.error("Failed to load user profile details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId, activeUser.id]);

  const handleFollowToggle = async () => {
    if (!profileData) return;
    try {
      const result = await api.toggleFollow(userId);
      setIsFollowing(result.following);
      setProfileData(prev => {
        if (!prev) return null;
        const newFollowers = result.following
          ? [...prev.followers, activeUser.id]
          : prev.followers.filter(id => id !== activeUser.id);
        return {
          ...prev,
          followers: newFollowers
        };
      });
      onRefreshFeed();
    } catch (err) {
      console.error("Follow toggling failed", err);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile({
        name: editName,
        bio: editBio,
        favoritePlatforms: editPlatforms,
        avatarUrl: editAvatar,
        bannerUrl: editBanner
      });
      onUpdateActiveUser(updated);
      setProfileData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          user: updated
        };
      });
      setIsEditing(false);
      onRefreshFeed();
    } catch (err) {
      console.error("Failed to save profile changes", err);
    }
  };

  const togglePlatform = (p: string) => {
    setEditPlatforms(prev =>
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const getStatusBadgeColor = (status: Review["status"]) => {
    switch (status) {
      case "Playing": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "Completed": return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30";
      case "Abandoned": return "bg-red-500/10 text-red-500 border border-red-550/30";
      case "Wishlist": return "bg-amber-500/10 text-amber-500 border border-amber-550/30";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  if (loading || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400 font-mono">
        <Gamepad2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <span>Cargando perfil del combatiente...</span>
      </div>
    );
  }

  const { user, posts, reviews, followers, following } = profileData;
  const stats = calculateGamerStats(user, posts, reviews, followers.length);
  const achievements = getGamerAchievements(user, posts, reviews, followers);

  const presetAvatars = [
    "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80"
  ];

  const presetBanners = [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&h=400&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&h=400&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&h=400&q=80",
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&h=400&q=80"
  ];

  return (
    <div className="space-y-6">
      {/* Banner & Avatar Showcase */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
        <div className="h-44 sm:h-56 w-full relative">
          <img
            src={user.bannerUrl}
            alt="Fondo de perfil"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Profile Info Row */}
        <div className="absolute -bottom-1 left-0 right-0 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative -mt-16 sm:mt-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full border-4 border-zinc-950 object-cover shadow-xl"
              />
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950" />
            </div>
            <div className="sm:pb-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {user.name}
                </h1>
                <span className={`text-[9px] tracking-wider uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${stats.rankColor}`}>
                  {stats.rankTitle}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-x-3 gap-y-1 mt-1.5 justify-center sm:justify-start">
                <p className="text-sm text-cyan-400 font-mono">@{user.username}</p>
                <span className="hidden sm:inline text-zinc-600">•</span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold">NIVEL {stats.level}</span>
                  <span className="text-zinc-400">{stats.xp} / {stats.xpToNextLevel} XP</span>
                </div>
              </div>
              
              {/* Custom Glowing XP Bar */}
              <div className="mt-2 w-44 sm:w-56 bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900 mx-auto sm:mx-0">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="sm:pb-2 flex justify-center gap-2">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl text-zinc-100 flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Perfil
              </button>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                  isFollowing
                    ? "bg-indigo-500/10 border border-indigo-500 text-indigo-400"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" /> Siguiendo
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Seguir Gamer
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSaveChanges} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-400" /> Configuración de mi Perfil Gamer
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Nombre Público</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Tu canal / Biografía</label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Cuéntanos a qué juegas..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Selecciona un Avatar Preset</label>
            <div className="flex gap-3">
              {presetAvatars.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEditAvatar(url)}
                  className={`relative rounded-full border-2 transition overflow-hidden h-12 w-12 ${
                    editAvatar === url ? "border-cyan-400 scale-105" : "border-zinc-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="preset" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Selecciona un Wallpaper Banner</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetBanners.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEditBanner(url)}
                  className={`h-12 rounded-lg border-2 overflow-hidden transition ${
                    editBanner === url ? "border-indigo-500 scale-[1.02]" : "border-zinc-850 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="banner" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Sistemas de Videojuegos (Plataformas)</label>
            <div className="flex flex-wrap gap-2">
              {["PC", "PS5", "Xbox Series X", "Nintendo Switch", "Android / iOS"].map((p) => {
                const checked = editPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                      checked
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                        : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-medium bg-zinc-800 rounded-xl text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl text-white hover:opacity-95 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Guardar Cambios
            </button>
          </div>
        </form>
      )}

      {/* Grid: Stats and Information card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Biografía</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {user.bio || "Este gamer prefiere mantener el misterio sobre sus andanzas."}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2.5">Plataformas Favoritas</h3>
              {user.favoritePlatforms && user.favoritePlatforms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.favoritePlatforms.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-1 text-[11px] font-mono bg-zinc-950 border border-zinc-800/80 rounded text-cyan-400 flex items-center gap-1.5"
                    >
                      <Gamepad2 className="w-3 h-3 text-cyan-400" /> {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic">Ninguna seleccionada</span>
              )}
            </div>

            <div className="border-t border-zinc-850 pt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-lg font-bold text-white font-mono">{posts.length}</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Posts</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-white font-mono">{followers.length}</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Seguidores</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-white font-mono">{following.length}</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Siguiendo</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-zinc-500 font-mono flex items-center gap-2 justify-center border-t border-zinc-850/40">
              <Calendar className="w-3.5 h-3.5" /> Miembro desde: {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Gamer Trophies & Achievements Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-indigo-400" /> Logros Gamer ({achievements.filter(a => a.status === "UNLOCKED").length}/{achievements.length})
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                +{achievements.filter(a => a.status === "UNLOCKED").reduce((sum, a) => sum + a.xpGain, 0)} XP
              </span>
            </div>

            <div className="space-y-3">
              {achievements.map((achievement) => {
                const isUnlocked = achievement.status === "UNLOCKED";
                return (
                  <div 
                    key={achievement.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      isUnlocked 
                        ? "bg-zinc-950/80 border-cyan-500/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" 
                        : "bg-zinc-950/40 border-zinc-850 opacity-60"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${
                      isUnlocked ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-900 text-zinc-500"
                    }`}>
                      {isUnlocked ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-grow">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isUnlocked ? "text-white" : "text-zinc-400"}`}>
                          {achievement.title}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          +{achievement.xpGain} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic content Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-zinc-800/80">
            <button
              onClick={() => setActiveTab("posts")}
              className={`pb-3 px-4 text-sm font-semibold relative transition ${
                activeTab === "posts" ? "text-cyan-400" : "text-zinc-400 hover:text-white"
              }`}
            >
              Publicaciones ({posts.length})
              {activeTab === "posts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 px-4 text-sm font-semibold relative transition ${
                activeTab === "reviews" ? "text-cyan-400" : "text-zinc-400 hover:text-white"
              }`}
            >
              Reseñas de Juegos ({reviews.length})
              {activeTab === "reviews" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          </div>

          {activeTab === "posts" ? (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-8 text-center text-zinc-500 font-mono text-xs">
                  Aún no se han compartido estados de texto o capturas.
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-zinc-500 font-mono">@{user.username}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {post.gameId && (
                      <button
                        onClick={() => onSelectGame(post.gameId!)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-850/80 text-xs text-indigo-400 hover:border-indigo-500 transition font-mono"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" /> Jugando a {post.gameTitle}
                      </button>
                    )}

                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-zinc-850 max-h-72">
                        <img src={post.imageUrl} alt="Contenido adjunto" referrerPolicy="no-referrer" className="w-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-zinc-500">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        <span>{post.likes.length} Likes</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        <span>{post.comments.length} Comentarios</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-8 text-center text-zinc-500 font-mono text-xs">
                  Aún no hay valoraciones ni estrellas asignadas a juegos.
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
                    {rev.gameCover && (
                      <button
                        onClick={() => onSelectGame(rev.gameId)}
                        className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shadow flex-shrink-0 border border-zinc-800 hover:border-indigo-500 transition"
                      >
                        <img
                          src={rev.gameCover}
                          alt={rev.gameTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}

                    <div className="flex-grow space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <button
                            onClick={() => onSelectGame(rev.gameId)}
                            className="text-md font-bold text-white hover:text-cyan-400 transition text-left"
                          >
                            {rev.gameTitle}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < rev.rating ? "fill-amber-400" : "text-zinc-650"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeColor(rev.status)}`}>
                              {rev.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        "{rev.content}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
