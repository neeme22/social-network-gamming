import { User, Game, Post, Review, Comment } from "./types";

// Get active simulate user ID from localStorage, defaults to AlexGamer (user-1)
export function getActiveSessionUserId(): string {
  const saved = localStorage.getItem("gaming_social_user_id");
  return saved || "user-1";
}

export function setActiveSessionUserId(userId: string) {
  localStorage.setItem("gaming_social_user_id", userId);
}

// Global headers builder with session info
function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-user-id": getActiveSessionUserId()
  };
}

export const api = {
  // Auth & Session
  getCurrentUser: async (): Promise<User> => {
    const res = await fetch("/api/auth/me", { headers: getHeaders() });
    if (!res.ok) throw new Error("No session");
    return res.json();
  },

  updateProfile: async (data: {
    name?: string;
    bio?: string;
    favoritePlatforms?: string[];
    avatarUrl?: string;
    bannerUrl?: string;
  }): Promise<User> => {
    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },

  register: async (name: string, username: string, email: string, favoritePlatforms?: string[]): Promise<User> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, email, favoritePlatforms })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to register");
    }
    return res.json();
  },

  login: async (username: string): Promise<User> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to login");
    }
    return res.json();
  },

  // Games
  getGames: async (): Promise<Game[]> => {
    const res = await fetch("/api/games", { headers: getHeaders() });
    return res.json();
  },

  getGameById: async (id: string): Promise<Game> => {
    const res = await fetch(`/api/games/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Juego no encontrado");
    return res.json();
  },

  searchGames: async (query: string): Promise<Game[]> => {
    const res = await fetch(`/api/games-search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
    return res.json();
  },

  // Reviews & Rating
  getReviews: async (filters: { gameId?: string; userId?: string } = {}): Promise<Review[]> => {
    const params = new URLSearchParams();
    if (filters.gameId) params.append("gameId", filters.gameId);
    if (filters.userId) params.append("userId", filters.userId);
    const res = await fetch(`/api/reviews?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  createReview: async (review: {
    gameId: string;
    gameTitle: string;
    gameCover?: string;
    rating: number;
    content: string;
    status: "Playing" | "Completed" | "Abandoned" | "Wishlist";
  }): Promise<Review> => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(review)
    });
    if (!res.ok) throw new Error("Failed to save review");
    return res.json();
  },

  deleteReview: async (id: string): Promise<void> => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Could not delete review");
  },

  // Posts Feed
  getPosts: async (): Promise<Post[]> => {
    const res = await fetch("/api/posts", { headers: getHeaders() });
    return res.json();
  },

  createPost: async (post: {
    content: string;
    imageUrl?: string;
    gameId?: string;
    gameTitle?: string;
  }): Promise<Post> => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(post)
    });
    if (!res.ok) throw new Error("Failed to post update");
    return res.json();
  },

  toggleLike: async (postId: string): Promise<{ likes: string[] }> => {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error("Failed to add comment");
    return res.json();
  },

  deletePost: async (id: string): Promise<void> => {
    const res = await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Could not delete post");
  },

  // Social Connections & Profiles
  getAllUsers: async (): Promise<User[]> => {
    const res = await fetch("/api/users", { headers: getHeaders() });
    return res.json();
  },

  getUserDetail: async (userId: string): Promise<{
    user: User;
    posts: Post[];
    reviews: Review[];
    followers: string[];
    following: string[];
  }> => {
    const res = await fetch(`/api/users/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("User detail not found");
    return res.json();
  },

  toggleFollow: async (targetId: string): Promise<{ following: boolean; followersCount: number; followingCount: number }> => {
    const res = await fetch(`/api/users/${targetId}/follow`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Follow action failed");
    return res.json();
  },

  // AI Gamer Oracle
  askGamerOracle: async (message: string): Promise<{ text: string }> => {
    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gamer Oracle connection lost");
    }
    return res.json();
  }
};
