// ============================================================
// STARBOUNDSGRP — Database Seeds
// ============================================================
// All content (scenepacks, tutorials, audio, messages) starts EMPTY.
// Real data is added by admins via the Admin Panel, and by users
// via the Lounge chat.
// ============================================================

import type { User, Scenepack, Tutorial, AudioTrack, ChatRoom, ChatMessage } from './models';

// No seeded users — sign-up via Supabase populates this naturally.
export const seedUsers: User[] = [];

// No default content — admins publish from the Admin Panel.
export const seedScenepacks: Scenepack[] = [];
export const seedTutorials: Tutorial[]   = [];
export const seedAudioTracks: AudioTrack[] = [];

// Chat rooms are fixed "channels" the community posts into — like Discord
// servers. We keep these so the Lounge is usable from day one.
export const seedRooms: ChatRoom[] = [
  { id: 'room_general',  name: 'general',       description: 'General discussion',         members: 0 },
  { id: 'room_editing',  name: 'editing-help',  description: 'Get help with editing',      members: 0 },
  { id: 'room_feedback', name: 'feedback',      description: 'Share and receive feedback', members: 0 },
  { id: 'room_showcase', name: 'showcase',      description: 'Show off your work',         members: 0 },
  { id: 'room_collabs',  name: 'collabs',       description: 'Find collaborators',         members: 0 },
];

// No seeded messages — first user to post bootstraps the conversation.
export const seedMessages: ChatMessage[] = [];
