// ============================================================
// STARBOUNDSGRP — Data Models
// These interfaces define the database schema.
// ============================================================

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // In production: bcrypt hash
  role: Role;
  avatar: string;
  joinedAt: string;
  lastLogin: string;
  bio: string;
  downloads: number;
  isVerified: boolean;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Scenepack {
  id: string;
  title: string;
  category: string;
  duration: string;
  clips: number;
  rating: number;
  downloads: number;
  tags: string[];
  isPremium: boolean;
  thumbnail: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  resolution: string;
  description: string;
  fileSize: string;
  status: 'published' | 'draft';
  fileUrl?: string;       // Supabase Storage URL or external link
  fileName?: string;      // Original file name for download
}

export interface Tutorial {
  id: string;
  title: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  views: number;
  likes: number;
  author: string;
  authorInitials: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  status: 'published' | 'draft';
  fileUrl?: string;
  fileName?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  category: string;
  bpm: number;
  plays: number;
  likes: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  fileSize: string;
  status: 'published' | 'draft';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  members: number;
}

export interface DownloadLog {
  id: string;
  userId: string;
  itemType: 'scenepack' | 'tutorial' | 'audio';
  itemId: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  userId: string;
  consultantId: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string;
}

// "Ping an Editor" — community-driven help requests
export type HelpCategory = 'Color Grading' | 'Motion Graphics' | 'Sound Design' | 'Transitions' | 'Software' | 'Workflow' | 'Other';
export type HelpUrgency = 'low' | 'medium' | 'high';
export type HelpStatus = 'open' | 'claimed' | 'resolved';

export interface HelpReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface HelpRequest {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  category: HelpCategory;
  urgency: HelpUrgency;
  status: HelpStatus;
  claimedBy?: string;        // user id of the editor who picked it up
  claimedByName?: string;
  replies: HelpReply[];
  createdAt: string;
  resolvedAt?: string;
}
