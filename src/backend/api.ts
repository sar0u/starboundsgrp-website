// ============================================================
// STARBOUNDSGRP — Backend API Service
// All "server" logic lives here. Each function simulates
// a REST endpoint with validation, auth checks, and responses.
// To connect a real server, replace the body of each function
// with a fetch() call to your Express / Next.js / Django API.
// ============================================================

import { loadTable, saveTable, loadRecord, saveRecord, generateId } from './database';
import { seedUsers, seedScenepacks, seedTutorials, seedAudioTracks, seedRooms, seedMessages } from './seed';
import type { User, Session, Scenepack, Tutorial, AudioTrack, ChatMessage, ChatRoom, Booking, DownloadLog, Role, HelpRequest, HelpReply, HelpCategory, HelpUrgency } from './models';
import { isSupabaseEnabled } from './supabase';
import {
  sbLogin, sbRegister, sbLoginWithDiscord, sbGetCurrentUser, sbLogout, sbResendVerification,
  sbRequestPasswordReset, sbUpdatePassword, sbUpdateProfile, sbUpdateEmail, sbInviteAdmin,
  sbFetchAdminEmails,
} from './authSupabase';
import { tableList, tableInsert, tableDelete } from './supabaseTables';

// Re-export for AppContext to use
export { sbFetchAdminEmails };

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
  // In Supabase mode, the caller's admin status is decided by Supabase
  // (via ADMIN_EMAILS + user_metadata.invitedAsAdmin in authSupabase.ts).
  // The frontend already checks `isAdmin` before showing the invite button,
  // so we just trust the call here and let Supabase handle it.
  if (isSupabaseEnabled) return sbInviteAdmin(email);
  // Demo / local mode: verify against the local users table.
  const users = loadTable<User>('users', seedUsers);
  const me = users.find(u => u.id === currentUserId);
  if (!me || me.role !== 'admin') return fail('Only admins can invite admins.', 403);
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
  // In Supabase mode, listing all users requires the service_role key
  // (which we don't expose client-side for security). Return empty list —
  // the UI shows the "Invite a new admin" card instead, which is the
  // proper flow.
  if (isSupabaseEnabled) return success([]);
  const users = loadTable<User>('users', seedUsers);
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== 'admin') return fail('Unauthorized.', 403);
  return success(users);
}

export async function apiSetUserRole(adminId: string, targetUserId: string, newRole: Role): Promise<ApiResponse<User>> {
  await delay(150);
  if (isSupabaseEnabled) {
    // Role changes for other users require the service_role key. The UI
    // hides the demote/promote buttons in Supabase mode (no users listed).
    return fail('Use the email invitation form to grant admin access.', 400);
  }
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
  if (isSupabaseEnabled) {
    const list = await tableList<Scenepack>('scenepacks');
    return success(list.filter((p) => p.status === 'published'));
  }
  await delay(80);
  const packs = loadTable<Scenepack>('scenepacks', seedScenepacks);
  return success(packs.filter((p) => p.status === 'published'));
}

export async function apiCreateScenepack(
  user: { id: string; name: string; role?: string },
  data: Partial<Scenepack>
): Promise<ApiResponse<Scenepack>> {
  if (!data.title?.trim()) return fail('Title is required.', 400);
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
    authorId: user.id,
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
  if (isSupabaseEnabled) {
    const r = await tableInsert('scenepacks', newPack);
    if (!r.ok) return fail(r.error || 'Could not publish.', 500);
    return success(newPack, 201);
  }
  // Local demo mode
  await delay(200);
  const users = loadTable<User>('users', seedUsers);
  const me = users.find((u) => u.id === user.id);
  if (!me || me.role !== 'admin') return fail('Only administrators can publish.', 403);
  const packs = loadTable<Scenepack>('scenepacks', seedScenepacks);
  packs.unshift(newPack);
  saveTable('scenepacks', packs);
  return success(newPack, 201);
}

export async function apiDeleteScenepack(_user: { id: string }, packId: string): Promise<ApiResponse<boolean>> {
  if (isSupabaseEnabled) {
    const r = await tableDelete('scenepacks', packId);
    if (!r.ok) return fail(r.error || 'Could not delete.', 500);
    return success(true);
  }
  await delay();
  let packs = loadTable<Scenepack>('scenepacks', seedScenepacks);
  packs = packs.filter((p) => p.id !== packId);
  saveTable('scenepacks', packs);
  return success(true);
}

// ─── TUTORIALS ────────────────────────────────────────────────
export async function apiGetTutorials(): Promise<ApiResponse<Tutorial[]>> {
  if (isSupabaseEnabled) {
    const list = await tableList<Tutorial>('tutorials');
    return success(list.filter((t) => t.status === 'published'));
  }
  await delay(80);
  const tuts = loadTable<Tutorial>('tutorials', seedTutorials);
  return success(tuts.filter((t) => t.status === 'published'));
}

export async function apiCreateTutorial(
  user: { id: string; name: string; avatar: string; role?: string },
  data: Partial<Tutorial>
): Promise<ApiResponse<Tutorial>> {
  if (!data.title?.trim()) return fail('Title is required.', 400);
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
    authorId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: data.content || '',
    status: 'published',
    fileUrl: data.fileUrl,
    fileName: data.fileName,
  };
  if (isSupabaseEnabled) {
    const r = await tableInsert('tutorials', newTut);
    if (!r.ok) return fail(r.error || 'Could not publish.', 500);
    return success(newTut, 201);
  }
  await delay(200);
  const users = loadTable<User>('users', seedUsers);
  const me = users.find((u) => u.id === user.id);
  if (!me || me.role !== 'admin') return fail('Only administrators can publish.', 403);
  const tuts = loadTable<Tutorial>('tutorials', seedTutorials);
  tuts.unshift(newTut);
  saveTable('tutorials', tuts);
  return success(newTut, 201);
}

export async function apiDeleteTutorial(_user: { id: string }, tutId: string): Promise<ApiResponse<boolean>> {
  if (isSupabaseEnabled) {
    const r = await tableDelete('tutorials', tutId);
    if (!r.ok) return fail(r.error || 'Could not delete.', 500);
    return success(true);
  }
  await delay();
  let tuts = loadTable<Tutorial>('tutorials', seedTutorials);
  tuts = tuts.filter((t) => t.id !== tutId);
  saveTable('tutorials', tuts);
  return success(true);
}

// ─── AUDIO ────────────────────────────────────────────────────
export async function apiGetAudioTracks(): Promise<ApiResponse<AudioTrack[]>> {
  if (isSupabaseEnabled) {
    const list = await tableList<AudioTrack>('audio_tracks');
    return success(list.filter((t) => t.status === 'published'));
  }
  await delay(80);
  const tracks = loadTable<AudioTrack>('audioTracks', seedAudioTracks);
  return success(tracks.filter((t) => t.status === 'published'));
}

export async function apiCreateAudioTrack(
  user: { id: string; name: string; role?: string },
  data: Partial<AudioTrack>
): Promise<ApiResponse<AudioTrack>> {
  if (!data.title?.trim()) return fail('Title is required.', 400);
  const newTrack: AudioTrack = {
    id: 'a_' + generateId(),
    title: data.title!.trim(),
    artist: data.artist || user.name,
    duration: data.duration || '3:00',
    category: data.category || 'Electronic',
    bpm: data.bpm || 120,
    plays: 0,
    likes: 0,
    authorId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: data.description || '',
    fileSize: data.fileSize || '—',
    status: 'published',
    fileUrl: data.fileUrl,
    fileName: data.fileName,
  };
  if (isSupabaseEnabled) {
    const r = await tableInsert('audio_tracks', newTrack);
    if (!r.ok) return fail(r.error || 'Could not publish.', 500);
    return success(newTrack, 201);
  }
  await delay(200);
  const users = loadTable<User>('users', seedUsers);
  const me = users.find((u) => u.id === user.id);
  if (!me || me.role !== 'admin') return fail('Only administrators can publish.', 403);
  const tracks = loadTable<AudioTrack>('audioTracks', seedAudioTracks);
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

// ─── PING AN EDITOR: Community help requests ──────────────────
export async function apiGetHelpRequests(): Promise<ApiResponse<HelpRequest[]>> {
  await delay(50);
  const list = loadTable<HelpRequest>('helpRequests', []);
  // Newest first, but resolved at the bottom
  list.sort((a, b) => {
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    if (b.status === 'resolved' && a.status !== 'resolved') return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return success(list);
}

export async function apiCreateHelpRequest(
  user: { id: string; name: string; avatar: string },
  data: { title: string; description: string; category: HelpCategory; urgency: HelpUrgency }
): Promise<ApiResponse<HelpRequest>> {
  await delay(120);
  if (!user?.id) return fail('Please sign in to post a request.', 401);
  if (!data.title.trim()) return fail('Title is required.', 400);
  const req: HelpRequest = {
    id: 'help_' + generateId(),
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category,
    urgency: data.urgency,
    status: 'open',
    replies: [],
    createdAt: new Date().toISOString(),
  };
  const list = loadTable<HelpRequest>('helpRequests', []);
  list.unshift(req);
  saveTable('helpRequests', list);
  return success(req, 201);
}

export async function apiClaimHelpRequest(
  user: { id: string; name: string },
  requestId: string
): Promise<ApiResponse<HelpRequest>> {
  await delay(100);
  if (!user?.id) return fail('Please sign in to claim a request.', 401);
  const list = loadTable<HelpRequest>('helpRequests', []);
  const req = list.find(r => r.id === requestId);
  if (!req) return fail('Request not found.', 404);
  if (req.authorId === user.id) return fail("You can't claim your own request.", 400);
  if (req.status === 'resolved') return fail('This request is already resolved.', 400);
  req.status = 'claimed';
  req.claimedBy = user.id;
  req.claimedByName = user.name;
  saveTable('helpRequests', list);
  return success(req);
}

export async function apiUnclaimHelpRequest(
  user: { id: string },
  requestId: string
): Promise<ApiResponse<HelpRequest>> {
  await delay(100);
  const list = loadTable<HelpRequest>('helpRequests', []);
  const req = list.find(r => r.id === requestId);
  if (!req) return fail('Request not found.', 404);
  if (req.claimedBy !== user.id) return fail('Only the claimer can release this.', 403);
  req.status = 'open';
  req.claimedBy = undefined;
  req.claimedByName = undefined;
  saveTable('helpRequests', list);
  return success(req);
}

export async function apiResolveHelpRequest(
  user: { id: string },
  requestId: string
): Promise<ApiResponse<HelpRequest>> {
  await delay(100);
  const list = loadTable<HelpRequest>('helpRequests', []);
  const req = list.find(r => r.id === requestId);
  if (!req) return fail('Request not found.', 404);
  // Only the original author can mark as resolved (they know if it actually helped)
  if (req.authorId !== user.id) return fail('Only the author can mark this resolved.', 403);
  req.status = 'resolved';
  req.resolvedAt = new Date().toISOString();
  saveTable('helpRequests', list);
  return success(req);
}

export async function apiReplyToHelpRequest(
  user: { id: string; name: string; avatar: string },
  requestId: string,
  content: string
): Promise<ApiResponse<HelpRequest>> {
  await delay(100);
  if (!user?.id) return fail('Please sign in to reply.', 401);
  if (!content.trim()) return fail('Reply cannot be empty.', 400);
  const list = loadTable<HelpRequest>('helpRequests', []);
  const req = list.find(r => r.id === requestId);
  if (!req) return fail('Request not found.', 404);
  const reply: HelpReply = {
    id: 'reply_' + generateId(),
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  req.replies.push(reply);
  saveTable('helpRequests', list);
  return success(req);
}

export async function apiDeleteHelpRequest(
  user: { id: string },
  requestId: string,
  isAdmin: boolean
): Promise<ApiResponse<boolean>> {
  await delay(80);
  const list = loadTable<HelpRequest>('helpRequests', []);
  const req = list.find(r => r.id === requestId);
  if (!req) return fail('Request not found.', 404);
  if (req.authorId !== user.id && !isAdmin) return fail("You can only delete your own requests.", 403);
  saveTable('helpRequests', list.filter(r => r.id !== requestId));
  return success(true);
}
