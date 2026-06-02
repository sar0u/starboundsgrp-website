// ============================================================
// STARBOUNDSGRP — Backend API Service
// All "server" logic lives here. Each function simulates
// a REST endpoint with validation, auth checks, and responses.
// To connect a real server, replace the body of each function
// with a fetch() call to your Express / Next.js / Django API.
// ============================================================

import { loadTable, saveTable, loadRecord, saveRecord, generateId } from './database';
import { seedUsers, seedScenepacks, seedTutorials, seedAudioTracks, seedRooms, seedMessages } from './seed';
import type { User, Session, Scenepack, Tutorial, AudioTrack, ChatMessage, ChatRoom, Booking, DownloadLog, Role } from './models';
import { isSupabaseEnabled } from './supabase';
import {
  sbLogin, sbRegister, sbLoginWithDiscord, sbGetCurrentUser, sbLogout, sbResendVerification,
  sbRequestPasswordReset, sbUpdatePassword, sbUpdateProfile, sbUpdateEmail, sbInviteAdmin,
} from './authSupabase';

export { isSupabaseEnabled };

// Simulate network latency
const delay = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Response Type ────────────────────────────────────────────
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

function success<T>(data: T, status = 200): ApiResponse<T> {
  return { ok: true, data, status };
}
function fail(error: string, status = 400): ApiResponse<never> {
  return { ok: false, error, status };
}

// ─── AUTH ─────────────────────────────────────────────────────
// Auth functions delegate to Supabase if configured, otherwise use
// the local demo backend below.

export async function apiLogin(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
  if (isSupabaseEnabled) return sbLogin(email, password);
  await delay();
  const users = loadTable<User>('users', seedUsers);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return fail('No account found with this email.', 404);
  if (user.passwordHash !== password) return fail('Incorrect password.', 401);
  const token = generateId() + generateId();
  const session: Session = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  };
  saveRecord('session', session);
  user.lastLogin = new Date().toISOString();
  saveTable('users', users);
  return success({ user, token });
}

export async function apiRegister(name: string, email: string, password: string, role: Role): Promise<ApiResponse<{ user: User; token: string; needsVerification?: boolean }>> {
  if (isSupabaseEnabled) return sbRegister(name, email, password, role);
  await delay(200);
  const users = loadTable<User>('users', seedUsers);
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return fail('An account with this email already exists.', 409);
  }
  if (password.length < 4) return fail('Password must be at least 4 characters.', 400);
  if (!name.trim()) return fail('Display name is required.', 400);
  const newUser: User = {
    id: 'user_' + generateId(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,
    role,
    avatar: name.trim().slice(0, 2).toUpperCase(),
    joinedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: '',
    downloads: 0,
    isVerified: false,
  };
  users.push(newUser);
  saveTable('users', users);
  const token = generateId() + generateId();
  const session: Session = { token, userId: newUser.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() };
  saveRecord('session', session);
  return success({ user: newUser, token, needsVerification: true });
}

export async function apiLoginWithDiscord(): Promise<ApiResponse<{ user?: User; token?: string; redirected?: boolean }>> {
  if (isSupabaseEnabled) {
    const res = await sbLoginWithDiscord();
    if (!res.ok) return res as ApiResponse<{ user?: User; token?: string; redirected?: boolean }>;
    return success({ redirected: true });
  }
  await delay(400); // simulate OAuth round-trip
  const users = loadTable<User>('users', seedUsers);
  const discordEmail = 'discord.user@starbound.com';
  let user = users.find((u) => u.email === discordEmail) as User | undefined;
  if (!user) {
    user = {
      id: 'discord_' + generateId(),
      name: 'DiscordEditor',
      email: discordEmail,
      passwordHash: '',
      role: 'user',
      avatar: 'DE',
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      bio: 'Signed in via Discord',
      downloads: 0,
      isVerified: true,
    };
    users.push(user);
    saveTable('users', users);
  } else {
    user.lastLogin = new Date().toISOString();
    saveTable('users', users);
  }
  const token = generateId() + generateId();
  const session: Session = { token, userId: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() };
  saveRecord('session', session);
  return success({ user, token });
}

export async function apiGetCurrentUser(): Promise<ApiResponse<User | null>> {
  if (isSupabaseEnabled) return sbGetCurrentUser();
  const session = loadRecord<Session | null>('session', null);
  if (!session) return success(null);
  if (new Date(session.expiresAt) < new Date()) {
    saveRecord('session', null);
    return success(null);
  }
  const users = loadTable<User>('users', seedUsers);
  const user = users.find((u) => u.id === session.userId) || null;
  return success(user);
}

export async function apiLogout(): Promise<ApiResponse<boolean>> {
  if (isSupabaseEnabled) return sbLogout();
  saveRecord('session', null);
  return success(true);
}

export async function apiResendVerification(email: string): Promise<ApiResponse<boolean>> {
  if (isSupabaseEnabled) return sbResendVerification(email);
  return success(true);
}

// ─── Password reset ────────────────────────────────────────
export async function apiRequestPasswordReset(email: string): Promise<ApiResponse<boolean>> {
  if (isSupabaseEnabled) return sbRequestPasswordReset(email);
  return success(true); // demo mode no-op
}

export async function apiUpdatePassword(newPassword: string): Promise<ApiResponse<boolean>> {
  if (isSupabaseEnabled) return sbUpdatePassword(newPassword);
  return success(true);
}

// ─── Profile management ───────────────────────────────────
export async function apiUpdateProfile(updates: { name?: string; phone?: string; bio?: string; avatar?: string }): Promise<ApiResponse<User>> {
  if (isSupabaseEnabled) return sbUpdateProfile(updates);
  // Local demo mode: update the user record
  const users = loadTable<User>('users', seedUsers);
  const sess = loadRecord<Session | null>('session', null);
  if (!sess) return fail('Not signed in.', 401);
  const u = users.find(x => x.id === sess.userId);
  if (!u) return fail('User not found.', 404);
  if (updates.name !== undefined) u.name = updates.name.trim() || u.name;
  if (updates.bio !== undefined) u.bio = updates.bio.trim();
  if (updates.avatar !== undefined) u.avatar = updates.avatar.trim().slice(0, 4).toUpperCase() || u.avatar;
  saveTable('users', users);
  return success(u);
}

export async function apiUpdateEmail(newEmail: string): Promise<ApiResponse<boolean>> {
  if (isSupabaseEnabled) return sbUpdateEmail(newEmail);
  return success(true);
}

// ─── Admin invitation by email ────────────────────────────
export async function apiInviteAdmin(currentUserId: string, email: string): Promise<ApiResponse<boolean>> {
  const users = loadTable<User>('users', seedUsers);
  const me = users.find(u => u.id === currentUserId);
  if (!me || me.role !== 'admin') return fail('Only admins can invite admins.', 403);
  if (isSupabaseEnabled) return sbInviteAdmin(email);
  // Demo mode: just mark the email as pre-approved
  return success(true);
}

export async function apiVerifyEmail(email: string, code: string): Promise<ApiResponse<User>> {
  // Only used by the local demo backend. With Supabase, users verify
  // by clicking the link sent to their inbox.
  await delay(500);
  if (code !== '1234') return fail('Invalid verification code.', 400);
  const users = loadTable<User>('users', seedUsers);
  const user = users.find(u => u.email === email);
  if (!user) return fail('User not found.', 404);
  user.isVerified = true;
  saveTable('users', users);
  return success(user);
}

// ─── USER MANAGEMENT (Admin only) ─────────────────────────────
export async function apiListUsers(adminId: string): Promise<ApiResponse<User[]>> {
  await delay(100);
  const users = loadTable<User>('users', seedUsers);
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== 'admin') return fail('Unauthorized.', 403);
  return success(users);
}

export async function apiSetUserRole(adminId: string, targetUserId: string, newRole: Role): Promise<ApiResponse<User>> {
  await delay(150);
  const users = loadTable<User>('users', seedUsers);
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== 'admin') return fail('Only admins can change roles.', 403);
  if (adminId === targetUserId) return fail("You can't change your own role.", 400);
  const target = users.find(u => u.id === targetUserId);
  if (!target) return fail('User not found.', 404);
  target.role = newRole;
  saveTable('users', users);
  return success(target);
}

// ─── SCENEPACKS ───────────────────────────────────────────────
export async function apiGetScenepacks(): Promise<ApiResponse<Scenepack[]>> {
  await delay(80);
  const packs = loadTable<Scenepack>('scenepacks', seedScenepacks);
  return success(packs.filter((p) => p.status === 'published'));
}

export async function apiCreateScenepack(userId: string, data: Partial<Scenepack>): Promise<ApiResponse<Scenepack>> {
  await delay(200);
  const users = loadTable<User>('users', seedUsers);
  const user = users.find((u) => u.id === userId);
  if (!user || user.role !== 'admin') return fail('Only administrators can create scenepacks.', 403);
  if (!data.title?.trim()) return fail('Title is required.', 400);
  const packs = loadTable<Scenepack>('scenepacks', seedScenepacks);
  const newPack: Scenepack = {
    id: 'sp_' + generateId(),
    title: data.title!.trim(),
    category: data.category || 'Urban',
    duration: data.duration || '10 min',
    clips: data.clips || 20,
    rating: 5.0,
    downloads: 0,
    tags: data.tags || [],
    isPremium: data.isPremium || false,
    thumbnail: 'custom',
    authorId: userId,
    authorName: user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolution: data.resolution || '4K',
    description: data.description || '',
    fileSize: data.fileSize || '—',
    status: 'published',
    fileUrl: data.fileUrl,
    fileName: data.fileName,
  };
  packs.unshift(newPack);
  saveTable('scenepacks', packs);
  return success(newPack, 201);
}

export async function apiDeleteScenepack(userId: string, packId: string): Promise<ApiResponse<boolean>> {
  await delay();
  const users = loadTable<User>('users', seedUsers);
  const user = users.find((u) => u.id === userId);
  if (!user || user.role !== 'admin') return fail('Unauthorized.', 403);
  let packs = loadTable<Scenepack>('scenepacks', seedScenepacks);
  packs = packs.filter((p) => p.id !== packId);
  saveTable('scenepacks', packs);
  return success(true);
}

// ─── TUTORIALS ────────────────────────────────────────────────
export async function apiGetTutorials(): Promise<ApiResponse<Tutorial[]>> {
  await delay(80);
  const tuts = loadTable<Tutorial>('tutorials', seedTutorials);
  return success(tuts.filter((t) => t.status === 'published'));
}

export async function apiCreateTutorial(userId: string, data: Partial<Tutorial>): Promise<ApiResponse<Tutorial>> {
  await delay(200);
  const users = loadTable<User>('users', seedUsers);
  const user = users.find((u) => u.id === userId);
  if (!user || user.role !== 'admin') return fail('Only administrators can create tutorials.', 403);
  if (!data.title?.trim()) return fail('Title is required.', 400);
  const tuts = loadTable<Tutorial>('tutorials', seedTutorials);
  const newTut: Tutorial = {
    id: 't_' + generateId(),
    title: data.title!.trim(),
    category: data.category || 'Visuals',
    duration: data.duration || '10 Mins',
    level: (data.level as Tutorial['level']) || 'Intermediate',
    description: data.description || '',
    views: 0,
    likes: 0,
    author: user.name,
    authorInitials: user.avatar,
    authorId: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: data.content || '',
    status: 'published',
    fileUrl: data.fileUrl,
    fileName: data.fileName,
  };
  tuts.unshift(newTut);
  saveTable('tutorials', tuts);
  return success(newTut, 201);
}

export async function apiDeleteTutorial(userId: string, tutId: string): Promise<ApiResponse<boolean>> {
  await delay();
  const users = loadTable<User>('users', seedUsers);
  const user = users.find((u) => u.id === userId);
  if (!user || user.role !== 'admin') return fail('Unauthorized.', 403);
  let tuts = loadTable<Tutorial>('tutorials', seedTutorials);
  tuts = tuts.filter((t) => t.id !== tutId);
  saveTable('tutorials', tuts);
  return success(true);
}

// ─── AUDIO ────────────────────────────────────────────────────
export async function apiGetAudioTracks(): Promise<ApiResponse<AudioTrack[]>> {
  await delay(80);
  const tracks = loadTable<AudioTrack>('audioTracks', seedAudioTracks);
  return success(tracks.filter((t) => t.status === 'published'));
}

export async function apiCreateAudioTrack(userId: string, data: Partial<AudioTrack>): Promise<ApiResponse<AudioTrack>> {
  await delay(200);
  const users = loadTable<User>('users', seedUsers);
  const user = users.find((u) => u.id === userId);
  if (!user || user.role !== 'admin') return fail('Only administrators can upload audio.', 403);
  if (!data.title?.trim()) return fail('Title is required.', 400);
  const tracks = loadTable<AudioTrack>('audioTracks', seedAudioTracks);
  const newTrack: AudioTrack = {
    id: 'a_' + generateId(),
    title: data.title!.trim(),
    artist: data.artist || user.name,
    duration: data.duration || '3:00',
    category: data.category || 'Electronic',
    bpm: data.bpm || 120,
    plays: 0,
    likes: 0,
    authorId: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: data.description || '',
    fileSize: data.fileSize || '—',
    status: 'published',
    fileUrl: data.fileUrl,
    fileName: data.fileName,
  };
  tracks.unshift(newTrack);
  saveTable('audioTracks', tracks);
  return success(newTrack, 201);
}

// ─── DOWNLOADS ────────────────────────────────────────────────
export async function apiDownload(userId: string, itemType: 'scenepack' | 'tutorial' | 'audio', itemId: string): Promise<ApiResponse<boolean>> {
  await delay(150);
  if (!userId) return fail('Please sign in to download.', 401);
  const log: DownloadLog = { id: generateId(), userId, itemType, itemId, timestamp: new Date().toISOString() };
  const logs = loadTable<DownloadLog>('downloadLogs', []);
  logs.push(log);
  saveTable('downloadLogs', logs);
  // Increment download count
  if (itemType === 'scenepack') {
    const packs = loadTable<Scenepack>('scenepacks', seedScenepacks);
    const pack = packs.find((p) => p.id === itemId);
    if (pack) { pack.downloads++; saveTable('scenepacks', packs); }
  }
  return success(true);
}

// ─── LIKES ────────────────────────────────────────────────────
export async function apiToggleLike(userId: string, key: string): Promise<ApiResponse<boolean>> {
  if (!userId) return fail('Please sign in.', 401);
  const likes = loadRecord<string[]>('likes_' + userId, []);
  const idx = likes.indexOf(key);
  if (idx >= 0) likes.splice(idx, 1); else likes.push(key);
  saveRecord('likes_' + userId, likes);
  return success(idx < 0);
}

export async function apiGetLikes(userId: string): Promise<ApiResponse<string[]>> {
  if (!userId) return success([]);
  return success(loadRecord<string[]>('likes_' + userId, []));
}

// ─── CHAT ─────────────────────────────────────────────────────
export async function apiGetRooms(): Promise<ApiResponse<ChatRoom[]>> {
  return success(loadTable<ChatRoom>('chatRooms', seedRooms));
}

export async function apiGetMessages(roomId: string): Promise<ApiResponse<ChatMessage[]>> {
  await delay(80);
  const msgs = loadTable<ChatMessage>('chatMessages', seedMessages);
  return success(msgs.filter((m) => m.roomId === roomId));
}

export async function apiSendMessage(userId: string, userName: string, avatar: string, roomId: string, content: string): Promise<ApiResponse<ChatMessage>> {
  await delay(100);
  if (!userId) return fail('Please sign in to chat.', 401);
  if (!content.trim()) return fail('Message cannot be empty.', 400);
  const msg: ChatMessage = {
    id: 'msg_' + generateId(),
    roomId,
    authorId: userId,
    authorName: userName,
    authorAvatar: avatar,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    likes: 0,
    replies: 0,
  };
  const msgs = loadTable<ChatMessage>('chatMessages', seedMessages);
  msgs.unshift(msg);
  saveTable('chatMessages', msgs);
  return success(msg, 201);
}

// ─── BOOKINGS ─────────────────────────────────────────────────
export async function apiCreateBooking(data: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<ApiResponse<Booking>> {
  await delay(200);
  const booking: Booking = {
    ...data,
    id: 'book_' + generateId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const bookings = loadTable<Booking>('bookings', []);
  bookings.push(booking);
  saveTable('bookings', bookings);
  return success(booking, 201);
}

// ─── STATS ────────────────────────────────────────────────────
export async function apiGetStats(): Promise<ApiResponse<{ scenepacks: number; tutorials: number; audio: number; users: number }>> {
  const sp = loadTable<Scenepack>('scenepacks', seedScenepacks);
  const tu = loadTable<Tutorial>('tutorials', seedTutorials);
  const au = loadTable<AudioTrack>('audioTracks', seedAudioTracks);
  const us = loadTable<User>('users', seedUsers);
  return success({ scenepacks: sp.length, tutorials: tu.length, audio: au.length, users: us.length });
}
