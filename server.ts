import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// ----------------------------------------------------
// DATABASE SYSTEM (JSON FILE PERSISTENCE)
// ----------------------------------------------------
const DB_FILE = path.join(process.cwd(), "database.json");

interface DBContent {
  users: any[];
  games: any[];
  posts: any[];
  reviews: any[];
  followers: any[];
}

// Initial seed data for games
const DEFAULT_GAMES = [
  {
    id: "elden-ring",
    title: "Elden Ring",
    description: "Alzaos, Sinluz, y que la gracia os guíe para abrazar el poder del Círculo de Elden y convertiros en un Señor de Elden en las Tierras Intermedias. Un imponente y vasto mundo abierto de fantasía oscura creado por Hidetaka Miyazaki y George R. R. Martin.",
    coverUrl: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2022-02-25",
    developer: "FromSoftware",
    genre: ["RPG", "Acción", "Fantasía Oscura"],
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One"],
    ratingAverage: 4.9,
    ratingsCount: 42
  },
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    description: "Cyberpunk 2077 es un RPG de aventura y acción de mundo abierto situado en Night City, una megalópolis obsesionada con el poder, el glamur y la modificación corporal. Te pones en la piel de V, un mercenario que busca un implante único que permite alcanzar la inmortalidad.",
    coverUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2020-12-10",
    developer: "CD Projekt Red",
    genre: ["RPG", "Acción", "Sci-Fi", "Cyberpunk"],
    platforms: ["PC", "PS5", "Xbox Series X/S", "PS4", "Xbox One"],
    ratingAverage: 4.5,
    ratingsCount: 31
  },
  {
    id: "the-legend-of-zelda-tears-of-the-kingdom",
    title: "The Legend of Zelda: Tears of the Kingdom",
    description: "Una aventura épica a lo largo y ancho de la tierra y los cielos de Hyrule en esta secuela de Breath of the Wild. En esta entrega, tú decides tu propio camino a través de los inmensos paisajes y las misteriosas islas flotantes en las alturas, usando nuevas habilidades de creación.",
    coverUrl: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2023-05-12",
    developer: "Nintendo EPD",
    genre: ["Aventura", "Acción", "Fantasía"],
    platforms: ["Nintendo Switch"],
    ratingAverage: 4.8,
    ratingsCount: 28
  },
  {
    id: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    description: "Funde un grupo de aventureros y vuelve a los Reinos Olvidados en una historia de compañerismo, traición, sacrificio, supervivencia y la atracción del poder absoluto. Una experiencia RPG de tablero de nueva generación profunda y reactiva, basada en el universo de Dungeons & Dragons.",
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2023-08-03",
    developer: "Larian Studios",
    genre: ["RPG", "Estrategia", "Mundo de Fantasía"],
    platforms: ["PC", "PS5", "Xbox Series X/S", "macOS"],
    ratingAverage: 4.9,
    ratingsCount: 35
  }
];

const DEFAULT_USERS = [
  {
    id: "user-1",
    name: "Alex Guerrero",
    username: "AlexGamer",
    email: "alex@gaming.social",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&h=400&q=80",
    bio: "Jugador competitivo de toda la vida. Me encantan los juegos de rol oscuros y los shooters tácticos. ¡Hablemos de lore de FromSoftware!",
    favoritePlatforms: ["PC", "PS5"],
    createdAt: new Date().toISOString()
  },
  {
    id: "user-2",
    name: "Sofía Link",
    username: "ZeldaLover",
    email: "sofia@gaming.social",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1200&h=400&q=80",
    bio: "Colecciono todo lo que tenga que ver con Nintendo y aventuras acogedoras. Actualmente explorando Tears of the Kingdom.",
    favoritePlatforms: ["Nintendo Switch"],
    createdAt: new Date().toISOString()
  },
  {
    id: "user-3",
    name: "Marcos Kratos",
    username: "ShadowBlade",
    email: "marcos@gaming.social",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&h=400&q=80",
    bio: "Speedrunner amateur y cazador de logros de PlayStation. Buscando conseguir platinos en todo mi catálogo.",
    favoritePlatforms: ["PS5", "PC"],
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_POSTS = [
  {
    id: "post-1",
    userId: "user-1",
    username: "AlexGamer",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
    content: "¡Al fin derroté a Malenia sin recibir golpes! Fueron horas y horas de práctica intensa pero valieron la pena por completo. ¡Qué obra maestra de boss pelea!",
    gameId: "elden-ring",
    gameTitle: "Elden Ring",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    likes: ["user-2", "user-3"],
    comments: [
      {
        id: "comment-1",
        postId: "post-1",
        userId: "user-2",
        username: "ZeldaLover",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "¡Dios mío, qué locura! Yo sigo sufriendo con las fases estándar de los jefes jajaja ¡Enhorabuena crack!",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: "post-2",
    userId: "user-2",
    username: "ZeldaLover",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    content: "Armando un nuevo puente volador gigante con la Ultramano en Zelda TOTK. La creatividad en este juego es directamente infinita. ¿Qué es lo más raro que habéis construido vosotros?",
    gameId: "the-legend-of-zelda-tears-of-the-kingdom",
    gameTitle: "The Legend of Zelda: Tears of the Kingdom",
    likes: ["user-1"],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  }
];

const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    userId: "user-1",
    username: "AlexGamer",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
    gameId: "elden-ring",
    gameTitle: "Elden Ring",
    gameCover: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=600&auto=format&fit=crop",
    rating: 5,
    content: "Un diseño artístico incomparable y dificultad desafiante pero justa. FromSoftware redefinió cómo debe sentirse un mundo abierto verdaderamente inmersivo y lleno de secretos.",
    status: "Completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: "rev-2",
    userId: "user-2",
    username: "ZeldaLover",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    gameId: "the-legend-of-zelda-tears-of-the-kingdom",
    gameTitle: "The Legend of Zelda: Tears of the Kingdom",
    gameCover: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=600&auto=format&fit=crop",
    rating: 5,
    content: "La física de este videojuego y las mecánicas de construcción rompen el molde tradicional de lo que es posible en una consola portátil. Es pura magia digital que alegra el corazón gamer.",
    status: "Playing",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  }
];

const DEFAULT_FOLLOWERS = [
  { id: "fol-1", followerId: "user-1", followingId: "user-2" },
  { id: "fol-2", followerId: "user-2", followingId: "user-1" },
  { id: "fol-3", followerId: "user-3", followingId: "user-1" }
];

// Read DB or write seed data if empty/unavailable
function loadDB(): DBContent {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return {
        users: parsed.users || DEFAULT_USERS,
        games: parsed.games || DEFAULT_GAMES,
        posts: parsed.posts || DEFAULT_POSTS,
        reviews: parsed.reviews || DEFAULT_REVIEWS,
        followers: parsed.followers || DEFAULT_FOLLOWERS
      };
    }
  } catch (err) {
    console.warn("Could not load database.json, seeding defaults", err);
  }

  const initial = {
    users: DEFAULT_USERS,
    games: DEFAULT_GAMES,
    posts: DEFAULT_POSTS,
    reviews: DEFAULT_REVIEWS,
    followers: DEFAULT_FOLLOWERS
  };
  saveDB(initial);
  return initial;
}

function saveDB(dbData: DBContent) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write database.json", err);
  }
}

let db = loadDB();

// ----------------------------------------------------
// GEMINI INTELLIGENT WRAPPER (VIDEO GAME DATABASE)
// ----------------------------------------------------
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Game creation with AI will be simulated or fallback heavily.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

// Fallback search games list when Gemini is inactive
const SEARCH_GAMES_POOL = [
  {
    id: "gta-v",
    title: "Grand Theft Auto V",
    description: "Cuando un joven estafador callejero, un ladrón de bancos retirado y un psicópata aterrador se ven involucrados con lo peor y más desquiciado del mundo criminal, el gobierno de los EE. UU. y la industria del espectáculo, tendrán que llevar a cabo una serie de peligrosos golpes para sobrevivir en una ciudad implacable en la que no pueden confiar en nadie, y mucho menos los unos en los otros.",
    coverUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2013-09-17",
    developer: "Rockstar North",
    genre: ["Acción", "Sandbox", "Mundo Abierto"],
    platforms: ["PC", "PS5", "Xbox Series X/S", "PS4", "Xbox One"],
    ratingAverage: 4.7,
    ratingsCount: 50
  },
  {
    id: "minecraft",
    title: "Minecraft",
    description: "Explora mundos infinitos y construye toda clase de cosas, desde la casa más sencilla hasta el castillo más grandioso. Juega de forma creativa con recursos ilimitados o adéntrate en el peligroso modo de supervivencia fabricando armas y armaduras para defenderte.",
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2011-11-18",
    developer: "Mojang Studios",
    genre: ["Aventura", "Sandbox", "Construcción"],
    platforms: ["PC", "PS4", "Xbox One", "Nintendo Switch", "Android", "iOS"],
    ratingAverage: 4.8,
    ratingsCount: 120
  },
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    description: "Desciende a la oscuridad y explora los caminos de un reino olvidado en Hollow Knight, una aventura de acción clásica en 2D en un vasto mundo interconectado. Explora cavernas serpenteantes, enfréntate a criaturas corrompidas y entabla amistad con extraños insectos.",
    coverUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2017-02-24",
    developer: "Team Cherry",
    genre: ["Metroidvania", "Acción", "Indie"],
    platforms: ["PC", "PS4", "Xbox One", "Nintendo Switch"],
    ratingAverage: 4.8,
    ratingsCount: 65
  },
  {
    id: "re4-remake",
    title: "Resident Evil 4 Remake",
    description: "Seis años después del desastre biológico en Raccoon City, Leon S. Kennedy es enviado a recatar a la hija del presidente de EE. UU., secuestrada en un apartado pueblo europeo donde a los habitantes les ocurre algo terrible. Un clásico de terror y acción completamente reinventado.",
    coverUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop",
    releaseDate: "2023-03-24",
    developer: "Capcom",
    genre: ["Terror", "Acción", "Survival Horror"],
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S"],
    ratingAverage: 4.7,
    ratingsCount: 40
  }
];

// Helper to query Gemini for dynamic video game structure
async function generateGameWithAI(query: string) {
  const ai = getGeminiClient();
  if (!ai) {
    // If no key, look through our fallback list for fuzzy matches
    const slugQuery = query.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const found = SEARCH_GAMES_POOL.find(
      g => g.id.includes(slugQuery) || slugQuery.includes(g.id) || g.title.toLowerCase().includes(query.toLowerCase())
    );
    if (found) return found;

    // Direct fallback if nothing is found
    return {
      id: slugQuery || "temp-game",
      title: query.charAt(0).toUpperCase() + query.slice(1),
      description: `Un videojuego asombroso sobre ${query}. (Este juego se autogeneró en base a tu consulta ya que el sistema está sin API key de Gemini, ¡pero es 100% interactivo!)`,
      coverUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop",
      releaseDate: "2024-05-18",
      developer: "Retro Software",
      genre: ["Acción", "Aventura"],
      platforms: ["PC", "PS5", "Xbox Series X/S", "Nintendo Switch"],
      ratingAverage: 4.0,
      ratingsCount: 1
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Proporciona información real y sumamente detallada sobre el videojuego: "${query}" para nuestra base de datos. Completa todos los campos en español de forma inmersiva y con un tono gamer entusiasta.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Official complete title of the game" },
            description: { type: Type.STRING, description: "Highly immersive, professional 2-3 paragraph summary focusing on mechanics, world, and story. Written in Spanish." },
            releaseDate: { type: Type.STRING, description: "Official game release date (YYYY-MM-DD)" },
            developer: { type: Type.STRING, description: "Developer and main publishing studios" },
            genre: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of Spanish-based genres like RPG, Mundo Abierto, Terror, Carreras"
            },
            platforms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Platforms e.g. PC, PS5, Xbox Series X/S, Nintendo Switch, PS4, iOS"
            }
          },
          required: ["title", "description", "releaseDate", "developer", "genre", "platforms"]
        }
      }
    });

    const bodyText = response.text ? response.text.trim() : "{}";
    const data = JSON.parse(bodyText);

    // Create unique dynamic slug
    const id = data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    // Pick high-quality general Unsplash covers based on genre or gaming
    const unsplashPics = [
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"
    ];
    const randomIndex = Math.floor(Math.random() * unsplashPics.length);
    const coverUrl = unsplashPics[randomIndex];

    return {
      id,
      title: data.title,
      description: data.description,
      coverUrl,
      releaseDate: data.releaseDate || "2024-01-01",
      developer: data.developer || "Desarrollador Desconocido",
      genre: data.genre || ["Acción"],
      platforms: data.platforms || ["PC", "PS5"],
      ratingAverage: 0,
      ratingsCount: 0
    };
  } catch (err) {
    console.error("Gemini failed to generate game search results, using dynamic mockup", err);
    // Simple mock game match
    const mockId = query.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    return {
      id: mockId,
      title: query,
      description: `Un juego épico sobre ${query}. El destino te espera para escribir tu propia leyenda.`,
      coverUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop",
      releaseDate: "2025-01-01",
      developer: "Triple-A Studios",
      genre: ["Acción", "Aventura"],
      platforms: ["PC", "PS5"],
      ratingAverage: 4.2,
      ratingsCount: 1
    };
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// System health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", activeDatabase: "JSON Local System", itemsCount: db.posts.length });
});

// Mock active user session system
// Since we don't have absolute cookies or complex JWT initially, we support passing "x-user-id" header.
// If not passed, we default to "user-1" (AlexGamer) to make it smooth, so the client has an active session instantly!
function getActiveUserId(req: any) {
  const h = req.headers["x-user-id"];
  if (h && typeof h === "string") {
    // Verify if exists
    const userExists = db.users.find(u => u.id === h);
    if (userExists) return h;
  }
  return "user-1"; // Default seed user AlexGamer
}

// Auth me endpoint
app.get("/api/auth/me", (req, res) => {
  const userId = getActiveUserId(req);
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Active user not found" });
  }
  res.json(user);
});

// Update Profile
app.post("/api/auth/profile", (req, res) => {
  const userId = getActiveUserId(req);
  const { name, bio, favoritePlatforms, avatarUrl, bannerUrl } = req.body;

  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  // Update fields if provided
  if (name !== undefined) db.users[userIndex].name = name;
  if (bio !== undefined) db.users[userIndex].bio = bio;
  if (favoritePlatforms !== undefined) db.users[userIndex].favoritePlatforms = favoritePlatforms;
  if (avatarUrl !== undefined) db.users[userIndex].avatarUrl = avatarUrl;
  if (bannerUrl !== undefined) db.users[userIndex].bannerUrl = bannerUrl;

  // Sync back profile changes across reviews / posts to preserve visual consistency
  const updatedUser = db.users[userIndex];
  db.posts.forEach(p => {
    if (p.userId === userId) {
      p.username = updatedUser.username;
      p.userAvatar = updatedUser.avatarUrl;
    }
    p.comments.forEach((c: any) => {
      if (c.userId === userId) {
        c.username = updatedUser.username;
        c.userAvatar = updatedUser.avatarUrl;
      }
    });
  });

  db.reviews.forEach(r => {
    if (r.userId === userId) {
      r.username = updatedUser.username;
      r.userAvatar = updatedUser.avatarUrl;
    }
  });

  saveDB(db);
  res.json(updatedUser);
});

// User Registration
app.post("/api/auth/register", (req, res) => {
  const { name, username, email, favoritePlatforms } = req.body;

  if (!name || !username || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check if username/email exists
  const exists = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "El usuario o correo electrónico ya está registrado." });
  }

  const defaultAvatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80`;
  const defaultBanner = `https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&h=400&q=80`;

  const newUser = {
    id: "user-" + Date.now(),
    name,
    username,
    email,
    avatarUrl: defaultAvatar,
    bannerUrl: defaultBanner,
    bio: "¡Hola! Acabo de registrarme en Gaming Social Network. ¿A qué estamos jugando?",
    favoritePlatforms: favoritePlatforms || ["PC"],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);
  res.status(201).json(newUser);
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Se requiere nombre de usuario" });
  }

  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  res.json(user);
});

// ----------------------------------------------------
// GAMES COLLECTION API & DYNAMIC SEARCH
// ----------------------------------------------------
app.get("/api/games", (req, res) => {
  res.json(db.games);
});

// Specific game lookup + AI lazy creation
app.get("/api/games/:id", async (req, res) => {
  const gameId = req.params.id;
  let game = db.games.find(g => g.id === gameId);

  if (game) {
    return res.json(game);
  }

  // If not found in local db, treat the param as query and create via Gemini
  try {
    const cleanQuery = gameId.replace(/-/g, " ");
    console.log(`Game not found: ${gameId}. Pulling dynamic generation for query: ${cleanQuery}`);
    const generated = await generateGameWithAI(cleanQuery);

    // Recheck check in case
    let secondCheck = db.games.find(g => g.id === generated.id);
    if (secondCheck) return res.json(secondCheck);

    db.games.push(generated);
    saveDB(db);
    res.json(generated);
  } catch (err) {
    res.status(404).json({ error: "Videojuego no encontrado en la base de datos." });
  }
});

// Search and create if zero results in current database
app.get("/api/games-search", async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== "string") {
    return res.json(db.games);
  }

  // Filter local first
  const localMatch = db.games.filter(
    g => g.title.toLowerCase().includes(query.toLowerCase()) || g.genre.some(gName => gName.toLowerCase().includes(query.toLowerCase()))
  );

  if (localMatch.length > 0) {
    return res.json(localMatch);
  }

  // If no local matches, fetch with Gemini as complete search and cache it
  try {
    const aiGame = await generateGameWithAI(query);
    // Push if unique
    if (!db.games.find(g => g.id === aiGame.id)) {
      db.games.push(aiGame);
      saveDB(db);
    }
    res.json([aiGame]);
  } catch (err) {
    res.json([]);
  }
});

// ----------------------------------------------------
// REVIEWS API
// ----------------------------------------------------
app.get("/api/reviews", (req, res) => {
  const { gameId, userId } = req.query;
  let matches = db.reviews;

  if (gameId) {
    matches = matches.filter(r => r.gameId === gameId);
  }
  if (userId) {
    matches = matches.filter(r => r.userId === userId);
  }

  res.json(matches);
});

app.post("/api/reviews", (req, res) => {
  const userId = getActiveUserId(req);
  const activeUser = db.users.find(u => u.id === userId);
  if (!activeUser) return res.status(401).json({ error: "Unauthorized" });

  const { gameId, gameTitle, gameCover, rating, content, status } = req.body;

  if (!gameId || !gameTitle || rating === undefined || !content || !status) {
    return res.status(400).json({ error: "Completa todos los campos de la reseña" });
  }

  // Check if review already exists to overwrite, or append
  const existingReviewIndex = db.reviews.findIndex(r => r.userId === userId && r.gameId === gameId);
  const reviewData = {
    id: existingReviewIndex !== -1 ? db.reviews[existingReviewIndex].id : "rev-" + Date.now(),
    userId,
    username: activeUser.username,
    userAvatar: activeUser.avatarUrl,
    gameId,
    gameTitle,
    gameCover: gameCover || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300",
    rating: Number(rating),
    content,
    status,
    createdAt: new Date().toISOString()
  };

  if (existingReviewIndex !== -1) {
    db.reviews[existingReviewIndex] = reviewData;
  } else {
    db.reviews.push(reviewData);
  }

  // Update Game scores dynamically
  const gameIndex = db.games.findIndex(g => g.id === gameId);
  if (gameIndex !== -1) {
    const gameReviews = db.reviews.filter(r => r.gameId === gameId);
    const sum = gameReviews.reduce((acc, current) => acc + current.rating, 0);
    db.games[gameIndex].ratingsCount = gameReviews.length;
    db.games[gameIndex].ratingAverage = parseFloat((sum / gameReviews.length).toFixed(1));
  }

  saveDB(db);
  res.json(reviewData);
});

app.delete("/api/reviews/:id", (req, res) => {
  const userId = getActiveUserId(req);
  const reviewId = req.params.id;

  const rIndex = db.reviews.findIndex(r => r.id === reviewId);
  if (rIndex === -1) return res.status(404).json({ error: "Review not found" });

  if (db.reviews[rIndex].userId !== userId) {
    return res.status(403).json({ error: "No tienes permiso para borrar esta reseña" });
  }

  const gameId = db.reviews[rIndex].gameId;
  db.reviews.splice(rIndex, 1);

  // Recalculate rating
  const gameIndex = db.games.findIndex(g => g.id === gameId);
  if (gameIndex !== -1) {
    const gameReviews = db.reviews.filter(r => r.gameId === gameId);
    if (gameReviews.length === 0) {
      db.games[gameIndex].ratingsCount = 0;
      db.games[gameIndex].ratingAverage = 0;
    } else {
      const sum = gameReviews.reduce((acc, current) => acc + current.rating, 0);
      db.games[gameIndex].ratingsCount = gameReviews.length;
      db.games[gameIndex].ratingAverage = parseFloat((sum / gameReviews.length).toFixed(1));
    }
  }

  saveDB(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// POSTS (FEED SOCIAL) & COMMENTING / LIKING
// ----------------------------------------------------
app.get("/api/posts", (req, res) => {
  // Sort reverse chronological
  const sorted = [...db.posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sorted);
});

app.post("/api/posts", (req, res) => {
  const userId = getActiveUserId(req);
  const activeUser = db.users.find(u => u.id === userId);
  if (!activeUser) return res.status(401).json({ error: "No autorizado" });

  const { content, imageUrl, gameId, gameTitle } = req.body;
  if (!content) {
    return res.status(400).json({ error: "El contenido del estado no puede estar vacío" });
  }

  const newPost = {
    id: "post-" + Date.now(),
    userId,
    username: activeUser.username,
    userAvatar: activeUser.avatarUrl,
    content,
    imageUrl: imageUrl || undefined,
    gameId: gameId || undefined,
    gameTitle: gameTitle || undefined,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  db.posts.push(newPost);
  saveDB(db);
  res.status(201).json(newPost);
});

// Toggle Likes
app.post("/api/posts/:id/like", (req, res) => {
  const userId = getActiveUserId(req);
  const postId = req.params.id;

  const postIndex = db.posts.findIndex(p => p.id === postId);
  if (postIndex === -1) return res.status(404).json({ error: "Post not found" });

  const post = db.posts[postIndex];
  const likedIndex = post.likes.indexOf(userId);

  if (likedIndex === -1) {
    post.likes.push(userId); // Like
  } else {
    post.likes.splice(likedIndex, 1); // Unlike
  }

  saveDB(db);
  res.json({ likes: post.likes });
});

// Comments
app.post("/api/posts/:id/comments", (req, res) => {
  const userId = getActiveUserId(req);
  const activeUser = db.users.find(u => u.id === userId);
  if (!activeUser) return res.status(401).json({ error: "No autorizado" });

  const postId = req.params.id;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: "El comentario no puede estar vacío" });

  const postIndex = db.posts.findIndex(p => p.id === postId);
  if (postIndex === -1) return res.status(404).json({ error: "Estado no encontrado" });

  const newComment = {
    id: "comment-" + Date.now(),
    postId,
    userId,
    username: activeUser.username,
    userAvatar: activeUser.avatarUrl,
    content,
    createdAt: new Date().toISOString()
  };

  db.posts[postIndex].comments.push(newComment);
  saveDB(db);
  res.status(201).json(newComment);
});

app.delete("/api/posts/:id", (req, res) => {
  const userId = getActiveUserId(req);
  const postId = req.params.id;

  const pIndex = db.posts.findIndex(p => p.id === postId);
  if (pIndex === -1) return res.status(404).json({ error: "Post not found" });

  if (db.posts[pIndex].userId !== userId) {
    return res.status(403).json({ error: "No puedes eliminar las publicaciones de otros usuarios" });
  }

  db.posts.splice(pIndex, 1);
  saveDB(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// SOCIAL CONNECTIONS / USERS SEARCH
// ----------------------------------------------------
app.get("/api/users", (req, res) => {
  res.json(db.users);
});

// Individual Profile detail (with counts + dynamic collections)
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const user = db.users.find(u => u.id === userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  // Get user-specific collections
  const userPosts = db.posts.filter(p => p.userId === userId);
  const userReviews = db.reviews.filter(r => r.userId === userId);

  // Followers and Following relationships
  const followersList = db.followers.filter(f => f.followingId === userId).map(f => f.followerId);
  const followingList = db.followers.filter(f => f.followerId === userId).map(f => f.followingId);

  res.json({
    user,
    posts: userPosts,
    reviews: userReviews,
    followers: followersList,
    following: followingList
  });
});

// Follow Connection Toggle
app.post("/api/users/:id/follow", (req, res) => {
  const activeUserId = getActiveUserId(req);
  const targetId = req.params.id;

  if (activeUserId === targetId) {
    return res.status(400).json({ error: "No puedes seguirte a ti mismo" });
  }

  const targetExists = db.users.find(u => u.id === targetId);
  if (!targetExists) return res.status(404).json({ error: "User not found" });

  const existingFollowIndex = db.followers.findIndex(
    f => f.followerId === activeUserId && f.followingId === targetId
  );

  let following = false;
  if (existingFollowIndex === -1) {
    const newFollow = {
      id: "fol-" + Date.now(),
      followerId: activeUserId,
      followingId: targetId
    };
    db.followers.push(newFollow);
    following = true;
  } else {
    db.followers.splice(existingFollowIndex, 1);
  }

  saveDB(db);

  // Return new array counts
  const followersList = db.followers.filter(f => f.followingId === targetId).map(f => f.followerId);
  const followingList = db.followers.filter(f => f.followerId === activeUserId).map(f => f.followingId);

  res.json({
    following,
    followersCount: followersList.length,
    followingCount: followingList.length
  });
});

// ----------------------------------------------------
// AI GAMER ORACLE CHAT ENDPOINT
// ----------------------------------------------------
app.post("/api/ai-chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "El mensaje no puede estar vacío" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback simulation when no API key is set
    const responses = [
      "⚔️ **¡Saludos, noble luchador de Gamerverse!** Me preguntas sobre tácticas y lore. Si estás jugando a *Elden Ring*, recuerda que la paciencia es tu mejor estadística. No te lances a lo loco; observa los patrones de ataque de los jefes y usa cenizas de guerra para romper su postura. ¿A qué boss te estás enfrentando?",
      "🌀 **¡Interesante dilema gamer!** En *The Legend of Zelda: Tears of the Kingdom*, la Ultramano es tu mejor recurso. Si quieres cruzar grandes abismos, acopla dos turbinas Zonnan a un planeador en un ángulo de 45 grados. ¡La física de Hyrule premiará tu ingenio!",
      "🤖 **¡Atención mercenario de Night City!** Si buscas sumergirte en *Cyberpunk 2077*, te recomiendo enfocar tu build en implantes cibernéticos como el *Sandevistan* para ralentizar el tiempo y rebanar a tus enemigos con katanas térmicas. El lore de Arasaka te espera.",
      "🎲 **¡La tirada de dados ha hablado!** En *Baldurs Gate 3*, nunca ignores las habilidades de Carisma ni el control de masas. Un bardo o un paladín pueden persuadir a ejércitos enteros para que se autodestruyan sin empuñar una sola espada en combate real.",
      "🔥 **Consejo del Oráculo**: Intenta diversificar tus plataformas para experimentar lo mejor de cada ecosistema. ¡No te encasilles en un único hardware!"
    ];
    // Artificial small delay for immersion
    await new Promise(resolve => setTimeout(resolve, 800));
    const text = responses[Math.floor(Math.random() * responses.length)] + "\n\n*🎮 [Sugerencia del sistema]: Configura tu `GEMINI_API_KEY` en los Secrets para interactuar libremente con el Oráculo real con respuestas personalizadas instantáneas.*";
    return res.json({ text });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: "Eres el Sabio Oráculo Gamer de la comunidad Gamerverse Social. Eres un erudito amigable y mega entusiasta de la historia de los videojuegos, speedruns, lore oculto, trucos y reviews. Responde siempre en español. Usa emojis gamers (🎮, ⚔️, 🛡️, 👾, 🏆, ✨, 💥) y formato Markdown de forma elegante. Mantén tus respuestas precisas, inspiradoras y con chispa para que el usuario sienta que habla con un verdadero veterano de los eSports."
      }
    });

    res.json({ text: response.text || "El Oráculo Gamer asiente en silencio. Intenta preguntar de nuevo." });
  } catch (err) {
    console.error("Failed to query AI Gamer Oracle", err);
    res.status(500).json({ error: "El Oráculo Gamer está ocupado en una incursión de raid. Inténtalo de nuevo." });
  }
});

// ----------------------------------------------------
// VITE DEV & PRODUCTION INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Development DevServer running on node: http://0.0.0.0:${PORT}`);
  });
}

startServer();
