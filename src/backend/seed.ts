// ============================================================
// STARBOUNDSGRP — Database Seeds (Default Data)
// ============================================================

import type { User, Scenepack, Tutorial, AudioTrack, ChatRoom, ChatMessage } from './models';

export const seedUsers: User[] = [
  {
    id: 'admin_001',
    name: 'StarAdmin',
    email: 'admin@starbound.com',
    passwordHash: 'admin123',
    role: 'admin',
    avatar: 'SA',
    joinedAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    bio: 'Lead administrator of starboundsgrp',
    downloads: 0,
    isVerified: true,
  },
];

export const seedScenepacks: Scenepack[] = [
  {
    id: 'sp_001', title: 'Cinematic City Nights', category: 'Urban',
    duration: '12 min', clips: 48, rating: 4.9, downloads: 2340,
    tags: ['4K', 'Night', 'Drone'], isPremium: true, thumbnail: 'city',
    authorId: 'admin_001', authorName: 'StarAdmin',
    createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z',
    resolution: '4K', description: 'Stunning night footage from Tokyo, NYC, and Dubai with cinematic color grading.', fileSize: '2.4 GB', status: 'published',
  },
  {
    id: 'sp_002', title: 'Nature Reimagined', category: 'Nature',
    duration: '18 min', clips: 72, rating: 4.8, downloads: 1890,
    tags: ['4K', 'Slow-mo', 'Aerial'], isPremium: false, thumbnail: 'nature',
    authorId: 'admin_001', authorName: 'StarAdmin',
    createdAt: '2024-05-15T00:00:00Z', updatedAt: '2024-05-15T00:00:00Z',
    resolution: '4K', description: 'Breathtaking nature scenes — mountains, oceans, forests — with cinematic color grading.', fileSize: '3.1 GB', status: 'published',
  },
  {
    id: 'sp_003', title: 'Action Sports Vol.3', category: 'Sports',
    duration: '15 min', clips: 60, rating: 4.7, downloads: 3200,
    tags: ['120fps', 'GoPro', 'Extreme'], isPremium: true, thumbnail: 'sports',
    authorId: 'admin_001', authorName: 'StarAdmin',
    createdAt: '2024-04-20T00:00:00Z', updatedAt: '2024-04-20T00:00:00Z',
    resolution: '1080p', description: 'High-energy sports footage — surfing, skateboarding, BMX — captured at 120fps.', fileSize: '1.8 GB', status: 'published',
  },
  {
    id: 'sp_004', title: 'Abstract Flow', category: 'Abstract',
    duration: '8 min', clips: 32, rating: 4.6, downloads: 1560,
    tags: ['Particles', 'CGI', 'Loop'], isPremium: false, thumbnail: 'abstract',
    authorId: 'admin_001', authorName: 'StarAdmin',
    createdAt: '2024-03-10T00:00:00Z', updatedAt: '2024-03-10T00:00:00Z',
    resolution: '4K', description: 'Mesmerizing abstract motion graphics and loopable particle systems.', fileSize: '1.2 GB', status: 'published',
  },
  {
    id: 'sp_005', title: 'Neon Cyberpunk', category: 'Sci-Fi',
    duration: '10 min', clips: 40, rating: 4.9, downloads: 4100,
    tags: ['Neon', 'Night', 'Urban'], isPremium: true, thumbnail: 'cyberpunk',
    authorId: 'admin_001', authorName: 'StarAdmin',
    createdAt: '2024-02-28T00:00:00Z', updatedAt: '2024-02-28T00:00:00Z',
    resolution: '4K', description: 'Futuristic cyberpunk visuals with neon lights, rain, and holographic effects.', fileSize: '2.8 GB', status: 'published',
  },
  {
    id: 'sp_006', title: 'Wedding Essentials', category: 'Events',
    duration: '25 min', clips: 100, rating: 4.5, downloads: 980,
    tags: ['Emotional', 'Slow-mo', 'Close-up'], isPremium: false, thumbnail: 'wedding',
    authorId: 'admin_001', authorName: 'StarAdmin',
    createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
    resolution: '4K', description: 'Everything you need for wedding videography — elegant shots and emotional moments.', fileSize: '4.5 GB', status: 'published',
  },
];

export const seedTutorials: Tutorial[] = [
  {
    id: 't_001', title: 'Color Magic', category: 'Visuals', duration: '8 Mins', level: 'Intermediate',
    description: 'Transform flat footage into cinematic masterpieces with our signature color-grading workflow. Learn how to balance tones and use LUTs effectively.',
    views: 12400, likes: 890, author: 'StarAdmin', authorInitials: 'SA', authorId: 'admin_001',
    createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z', content: '', status: 'published',
  },
  {
    id: 't_002', title: 'Velocity Secrets', category: 'Rhythm', duration: '12 Mins', level: 'Advanced',
    description: 'Master the art of time-remapping. Create butter-smooth slow motion and aggressive speed ramps that perfectly match your audio beat.',
    views: 8900, likes: 650, author: 'StarAdmin', authorInitials: 'SA', authorId: 'admin_001',
    createdAt: '2024-05-20T00:00:00Z', updatedAt: '2024-05-20T00:00:00Z', content: '', status: 'published',
  },
  {
    id: 't_003', title: 'Layer Mastery', category: 'Structure', duration: '5 Mins', level: 'Beginner',
    description: 'Stop hunting for clips. Organize your timeline like a pro with nesting, adjustment layers, and color-coded hierarchies.',
    views: 15200, likes: 1200, author: 'StarAdmin', authorInitials: 'SA', authorId: 'admin_001',
    createdAt: '2024-04-15T00:00:00Z', updatedAt: '2024-04-15T00:00:00Z', content: '', status: 'published',
  },
  {
    id: 't_004', title: 'Sound Design Basics', category: 'Audio', duration: '15 Mins', level: 'Beginner',
    description: 'Learn the fundamentals of audio editing. From EQ to compression, make your videos sound as good as they look.',
    views: 6700, likes: 430, author: 'StarAdmin', authorInitials: 'SA', authorId: 'admin_001',
    createdAt: '2024-03-10T00:00:00Z', updatedAt: '2024-03-10T00:00:00Z', content: '', status: 'published',
  },
  {
    id: 't_005', title: 'Transition Techniques', category: 'Visuals', duration: '10 Mins', level: 'Intermediate',
    description: 'Seamless transitions that elevate your storytelling. From whip pans to match cuts, master the art of visual flow.',
    views: 21000, likes: 1800, author: 'StarAdmin', authorInitials: 'SA', authorId: 'admin_001',
    createdAt: '2024-02-20T00:00:00Z', updatedAt: '2024-02-20T00:00:00Z', content: '', status: 'published',
  },
];

export const seedAudioTracks: AudioTrack[] = [
  { id: 'a_001', title: 'Neon Pulse', artist: 'Starbound Audio', duration: '3:24', category: 'Electronic', bpm: 128, plays: 5400, likes: 320, authorId: 'admin_001', createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z', description: 'High-energy electronic track perfect for urban edits.', fileSize: '8.2 MB', status: 'published' },
  { id: 'a_002', title: 'Cinematic Rise', artist: 'Epic Sounds', duration: '2:45', category: 'Orchestral', bpm: 110, plays: 3200, likes: 210, authorId: 'admin_001', createdAt: '2024-05-15T00:00:00Z', updatedAt: '2024-05-15T00:00:00Z', description: 'Epic orchestral build-up for dramatic reveals.', fileSize: '6.8 MB', status: 'published' },
  { id: 'a_003', title: 'Lo-Fi Dreams', artist: 'Chill Vibes', duration: '4:12', category: 'Lo-Fi', bpm: 85, plays: 8900, likes: 670, authorId: 'admin_001', createdAt: '2024-04-20T00:00:00Z', updatedAt: '2024-04-20T00:00:00Z', description: 'Relaxing lo-fi beats for lifestyle content.', fileSize: '9.4 MB', status: 'published' },
  { id: 'a_004', title: 'Trap Energy', artist: 'Beat Masters', duration: '3:08', category: 'Hip-Hop', bpm: 140, plays: 6700, likes: 450, authorId: 'admin_001', createdAt: '2024-03-10T00:00:00Z', updatedAt: '2024-03-10T00:00:00Z', description: 'Hard-hitting trap beat with heavy bass.', fileSize: '7.6 MB', status: 'published' },
  { id: 'a_005', title: 'Ambient Space', artist: 'Cosmic Tones', duration: '5:30', category: 'Ambient', bpm: 72, plays: 2100, likes: 180, authorId: 'admin_001', createdAt: '2024-02-28T00:00:00Z', updatedAt: '2024-02-28T00:00:00Z', description: 'Deep space ambient textures for intros and transitions.', fileSize: '12.1 MB', status: 'published' },
  { id: 'a_006', title: 'Retro Wave', artist: 'Synthwave Pro', duration: '3:55', category: 'Synthwave', bpm: 120, plays: 4500, likes: 340, authorId: 'admin_001', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z', description: '80s synthwave vibes with modern production quality.', fileSize: '8.9 MB', status: 'published' },
];

export const seedRooms: ChatRoom[] = [
  { id: 'room_general', name: 'general', description: 'General discussion', members: 1240 },
  { id: 'room_editing', name: 'editing-help', description: 'Get help with editing', members: 890 },
  { id: 'room_feedback', name: 'feedback', description: 'Share and receive feedback', members: 560 },
  { id: 'room_showcase', name: 'showcase', description: 'Show off your work', members: 720 },
  { id: 'room_collabs', name: 'collabs', description: 'Find collaborators', members: 340 },
];

export const seedMessages: ChatMessage[] = [
  { id: 'msg_001', roomId: 'room_general', authorId: 'user_alex', authorName: 'AlexEditor', authorAvatar: 'AE', content: 'Just dropped a new velocity edit using the latest scenepack! The slow-mo transitions are insane 🔥', timestamp: new Date(Date.now() - 120000).toISOString(), likes: 24, replies: 5 },
  { id: 'msg_002', roomId: 'room_general', authorId: 'user_maya', authorName: 'MayaCuts', authorAvatar: 'MC', content: 'Anyone tried the new Color Magic tutorial? The LUT workflow changed my whole approach.', timestamp: new Date(Date.now() - 300000).toISOString(), likes: 18, replies: 3 },
  { id: 'msg_003', roomId: 'room_general', authorId: 'user_jake', authorName: 'JakeMotion', authorAvatar: 'JM', content: 'Looking for a collab partner for a sports highlight reel. DM me if interested! 🏀', timestamp: new Date(Date.now() - 720000).toISOString(), likes: 8, replies: 12 },
  { id: 'msg_004', roomId: 'room_general', authorId: 'user_sarah', authorName: 'SarahEdits', authorAvatar: 'SE', content: 'Sharing my latest wedding edit. Used the Wedding Essentials pack — love the emotional close-ups! 💛', timestamp: new Date(Date.now() - 1200000).toISOString(), likes: 45, replies: 8 },
  { id: 'msg_005', roomId: 'room_general', authorId: 'user_devin', authorName: 'DevinVFX', authorAvatar: 'DV', content: 'Pro tip: Stack your adjustment layers in this order → Curves → HSL → LUT → Grain', timestamp: new Date(Date.now() - 2100000).toISOString(), likes: 67, replies: 15 },
];
