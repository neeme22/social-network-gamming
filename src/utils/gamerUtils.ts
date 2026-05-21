/**
 * Centralized Gamification and XP Engine for Gamerverse Social
 */
import { User, Post, Review } from "../types";

export interface GamerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  progressPercent: number;
  rankTitle: string;
  rankColor: string;
}

/**
 * Calculates deterministic XP and level for any user based on their entity count
 * and a seed value derived from their username string to ensure seed accounts 
 * feel alive and leveling up is instantly reactive.
 */
export function calculateGamerStats(
  user: User,
  allPosts: Post[] = [],
  allReviews: Review[] = [],
  followersCount: number = 0
): GamerStats {
  // 1. Seed base XP from ASCII codes of username to make profiles feel diverse
  let baseXP = 0;
  if (user && user.username) {
    for (let i = 0; i < user.username.length; i++) {
      baseXP += user.username.charCodeAt(i);
    }
    baseXP = (baseXP * 7) % 360; // stable seed between 0 and 360
  }

  // 2. Count active contributions in runtime state
  const userPostsCount = allPosts.filter(p => p.userId === user.id).length;
  const userReviewsCount = allReviews.filter(r => r.userId === user.id).length;
  const userCommentsCount = allPosts.reduce((acc, p) => {
    return acc + p.comments.filter(c => c.userId === user.id).length;
  }, 0);

  // 3. Weight actions
  const postXP = userPostsCount * 45;
  const reviewXP = userReviewsCount * 95;
  const commentXP = userCommentsCount * 20;
  const popularXP = followersCount * 30;

  const totalXP = baseXP + postXP + reviewXP + commentXP + popularXP;

  // 4. Calculate Level using a standard RPG curve (e.g. 100 XP per level)
  const xpPerLevel = 100;
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const xpInCurrentLevel = totalXP % xpPerLevel;
  const progressPercent = Math.min(100, Math.floor((xpInCurrentLevel / xpPerLevel) * 100));

  // Determine Rank Badges
  let rankTitle = "Recluta Noob";
  let rankColor = "text-zinc-400 bg-zinc-950 border-zinc-850";

  if (level >= 9) {
    rankTitle = "Leyenda SSS";
    rankColor = "text-amber-400 bg-amber-950/40 border-amber-500/50";
  } else if (level >= 6) {
    rankTitle = "Pro Esport Elite";
    rankColor = "text-indigo-400 bg-indigo-950/40 border-indigo-500/50";
  } else if (level >= 4) {
    rankTitle = "Gamer Competitivo";
    rankColor = "text-cyan-400 bg-cyan-950/40 border-cyan-500/50";
  } else if (level >= 2) {
    rankTitle = "Casual Explorer";
    rankColor = "text-emerald-400 bg-emerald-950/40 border-emerald-500/50";
  }

  return {
    level,
    xp: xpInCurrentLevel,
    xpToNextLevel: xpPerLevel,
    progressPercent,
    rankTitle,
    rankColor
  };
}

export interface GamerAchievement {
  id: string;
  title: string;
  description: string;
  status: "LOCKED" | "UNLOCKED";
  iconName: string;
  xpGain: number;
}

/**
 * Gets achievements status list for profile viewer
 */
export function getGamerAchievements(
  user: User,
  userPosts: Post[],
  userReviews: Review[],
  followers: string[]
): GamerAchievement[] {
  return [
    {
      id: "recruit",
      title: "Avatar Activado",
      description: "Haber ingresado e inaugurado tu canal gamer",
      status: "UNLOCKED",
      iconName: "Shield",
      xpGain: 50
    },
    {
      id: "influencer",
      title: "Líder de Gremio",
      description: "Poseer al menos un seguidor en tu feed",
      status: followers.length > 0 ? "UNLOCKED" : "LOCKED",
      iconName: "Users",
      xpGain: 100
    },
    {
      id: "writer",
      title: "Crítico de Elite",
      description: "Escribir al menos un análisis técnico de un juego",
      status: userReviews.length > 0 ? "UNLOCKED" : "LOCKED",
      iconName: "Award",
      xpGain: 150
    },
    {
      id: "broadcaster",
      title: "Radiodifusor Muro",
      description: "Publicar un estado o adjuntar captura de pantalla",
      status: userPosts.length > 0 ? "UNLOCKED" : "LOCKED",
      iconName: "MessageSquare",
      xpGain: 80
    },
    {
      id: "multisystem",
      title: "Plataformas Max",
      description: "Tener 3 o más sistemas de consolas favoritas",
      status: (user.favoritePlatforms || []).length >= 3 ? "UNLOCKED" : "LOCKED",
      iconName: "Gamepad2",
      xpGain: 120
    }
  ];
}
