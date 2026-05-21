/**
 * Global TypeScript types for Gaming Social Network
 */

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  favoritePlatforms: string[]; // 'PC' | 'PS5' | 'Xbox' | 'Nintendo' | etc
  createdAt: string;
}

export interface Game {
  id: string; // url-friendly slug or UUID
  title: string;
  description: string;
  coverUrl: string;
  backdropUrl?: string;
  releaseDate: string;
  developer: string;
  genre: string[];
  platforms: string[]; // e.g. ["PC", "PS5", "Xbox Series X", "Nintendo Switch"]
  ratingAverage: number; // 0 to 5
  ratingsCount: number;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  imageUrl?: string;
  gameId?: string; // Optional tagging of a game
  gameTitle?: string; // Optional tagged game name
  likes: string[]; // List of userId's who liked this
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  gameId: string;
  gameTitle: string;
  gameCover?: string;
  rating: number; // 1 to 5 stars
  content: string;
  status: "Playing" | "Completed" | "Abandoned" | "Wishlist";
  createdAt: string;
}

export interface FollowerRelation {
  id: string;
  followerId: string; // The user who is following
  followingId: string; // The user being followed
}
