import React, { useState } from "react";
import { User } from "../types";
import { api, setActiveSessionUserId } from "../api";
import { Shield, Sparkles, UserPlus, LogIn, ChevronRight, Check } from "lucide-react";

interface AuthModalProps {
  onSuccess: (user: User) => void;
  allUsers: User[];
  onRefreshUsers: () => void;
}

export default function AuthModal({ onSuccess, allUsers, onRefreshUsers }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [usernameInput, setUsernameInput] = useState("");
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPlatforms, setRegPlatforms] = useState<string[]>(["PC"]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availablePlatforms = ["PC", "PS5", "Xbox Series X", "Nintendo Switch", "Android / iOS"];

  const handleSelectQuickUser = (userId: string) => {
    setActiveSessionUserId(userId);
    setLoading(true);
    api.getCurrentUser()
      .then((user) => {
        onSuccess(user);
        setError(null);
      })
      .catch((err) => setError("Error al cambiar de cuenta"))
      .finally(() => setLoading(false));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const user = await api.login(usernameInput.trim());
      setActiveSessionUserId(user.id);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Usuario no encontrado");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regEmail.trim()) {
      setError("Por favor, rellena todos los campos");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await api.register(
        regName.trim(),
        regUsername.trim().replace(/\s+/g, ""),
        regEmail.trim(),
        regPlatforms
      );
      setActiveSessionUserId(user.id);
      onRefreshUsers();
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (p: string) => {
    setRegPlatforms(prev =>
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:p-8 max-w-xl w-full mx-auto shadow-2xl relative overflow-hidden">
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-xl shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-1.5">
            Portal Gamer <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          </h2>
          <p className="text-xs text-zinc-400">Selecciona o crea tu perfil para ingresar al feed</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-950/40 border border-red-850/60 rounded-xl text-red-450 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl mb-6 border border-zinc-850">
        <button
          onClick={() => { setActiveTab("login"); setError(null); }}
          className={`py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "login"
              ? "bg-zinc-800/80 text-white shadow"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <LogIn className="w-4 h-4" /> Ingresar
        </button>
        <button
          onClick={() => { setActiveTab("register"); setError(null); }}
          className={`py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "register"
              ? "bg-zinc-800/80 text-white shadow"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Registrarse
        </button>
      </div>

      {activeTab === "login" ? (
        <div className="space-y-6">
          {/* Quick accounts list */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2.5">
              Acceso Rápido (Cuentas Seed)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {allUsers.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectQuickUser(u.id)}
                  disabled={loading}
                  className="flex flex-col items-center p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 hover:border-indigo-500/85 hover:bg-zinc-900/60 transition group text-center"
                >
                  <div className="relative mb-2">
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-zinc-800 group-hover:border-cyan-400 transition"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                  </div>
                  <span className="font-semibold text-xs text-white group-hover:text-cyan-400 truncate w-full max-w-[120px]">
                    {u.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono truncate w-full max-w-[120px]">
                    @{u.username}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800" />
            <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
              o ingresa con tu usuario
            </span>
            <div className="flex-grow border-t border-zinc-800" />
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                Nombre de Usuario (@Tag)
              </label>
              <input
                id="login-username"
                type="text"
                placeholder="Ejemplo: AlexGamer"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !usernameInput.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition duration-250 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
            >
              Cargar Sesión <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
              Nombre Completo
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="Ejemplo: Diana Prince"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="reg-username" className="block text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
              Nombre de Usuario (@Tag)
            </label>
            <input
              id="reg-username"
              type="text"
              placeholder="Ejemplo: DianaArcade (Sin espacios)"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
              Correo Electrónico
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="Ejemplo: diana@arcade.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
              Plataformas Favoritas
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map((p) => {
                const selected = regPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                      selected
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                        : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {selected && <Check className="w-3.5 h-3.5" />} {p}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !regName || !regUsername || !regEmail}
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition duration-250 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm mt-4"
          >
            Comenzar mi Aventura Gamer <Sparkles className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
