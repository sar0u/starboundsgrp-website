import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, Scenepack, Tutorial, AudioTrack, ChatMessage, ChatRoom } from '../backend/models';
import * as api from '../backend/api';
import { supabase, isSupabaseEnabled } from '../backend/supabase';
import { downloadScenepack, downloadTutorial, downloadAudio } from '../utils/download';

export { isSupabaseEnabled };

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppState {
  user: User | null;
  loading: boolean;
  scenepacks: Scenepack[];
  tutorials: Tutorial[];
  audioTracks: AudioTrack[];
  chatRooms: ChatRoom[];
  chatMessages: ChatMessage[];
  likedItems: Set<string>;
  notifications: Notification[];
  stats: { scenepacks: number; tutorials: number; audio: number; users: number };
}

interface AppActions {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithDiscord: () => Promise<{ ok: boolean; error?: string; redirected?: boolean }>;
  register: (name: string, email: string, password: string, role: 'admin' | 'user') => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addScenepack: (data: Partial<Scenepack>) => Promise<{ ok: boolean; error?: string }>;
  addTutorial: (data: Partial<Tutorial>) => Promise<{ ok: boolean; error?: string }>;
  addAudioTrack: (data: Partial<AudioTrack>) => Promise<{ ok: boolean; error?: string }>;
  deleteScenepack: (id: string) => Promise<void>;
  deleteTutorial: (id: string) => Promise<void>;
  download: (type: 'scenepack' | 'tutorial' | 'audio', id: string) => void;
  toggleLike: (key: string) => void;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  loadMessages: (roomId: string) => Promise<void>;
  notify: (type: Notification['type'], message: string) => void;
  listUsers: () => Promise<import('../backend/models').User[]>;
  setUserRole: (targetUserId: string, newRole: 'admin' | 'user') => Promise<{ ok: boolean; error?: string }>;
  isAdmin: boolean;
}

type AppCtx = AppState & AppActions;

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenepacks, setScenepacks] = useState<Scenepack[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ scenepacks: 0, tutorials: 0, audio: 0, users: 0 });

  // ─── Toast notifications ────────────────────────────────────
  const notify = useCallback((type: Notification['type'], message: string) => {
    const id = Date.now().toString(36);
    setNotifications((p) => [...p, { id, type, message }]);
    setTimeout(() => setNotifications((p) => p.filter((n) => n.id !== id)), 3800);
  }, []);

  // ─── Load all data ──────────────────────────────────────────
  const refreshData = useCallback(async () => {
    const [sp, tu, au, ro, st] = await Promise.all([
      api.apiGetScenepacks(),
      api.apiGetTutorials(),
      api.apiGetAudioTracks(),
      api.apiGetRooms(),
      api.apiGetStats(),
    ]);
    if (sp.ok && sp.data) setScenepacks(sp.data);
    if (tu.ok && tu.data) setTutorials(tu.data);
    if (au.ok && au.data) setAudioTracks(au.data);
    if (ro.ok && ro.data) setChatRooms(ro.data);
    if (st.ok && st.data) setStats(st.data);
  }, []);

  // ─── Init: restore session ─────────────────────────────────
  useEffect(() => {
    (async () => {
      const res = await api.apiGetCurrentUser();
      if (res.ok && res.data) setUser(res.data);
      await refreshData();
      setLoading(false);
    })();
  }, [refreshData]);

  // ─── Supabase auth listener (for OAuth redirects & email confirmation) ─
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const res = await api.apiGetCurrentUser();
        if (res.ok && res.data) {
          setUser(res.data);
          if (event === 'SIGNED_IN') notify('success', `Welcome, ${res.data.name}!`);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [notify]);

  // ─── Load likes when user changes ─────────────────────────
  useEffect(() => {
    if (!user) { setLikedItems(new Set()); return; }
    api.apiGetLikes(user.id).then((r) => {
      if (r.ok && r.data) setLikedItems(new Set(r.data));
    });
  }, [user]);

  // ─── Auth ───────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await api.apiLogin(email, password);
    if (res.ok && res.data) {
      setUser(res.data.user);
      notify('success', `Welcome back, ${res.data.user.name}!`);
      await refreshData();
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, [notify, refreshData]);

  const loginWithDiscord = useCallback(async () => {
    const res = await api.apiLoginWithDiscord();
    if (!res.ok) return { ok: false, error: res.error };
    // Supabase path: browser will redirect to Discord, then back. The auth
    // listener (above) will pick up the session and set the user.
    if (res.data?.redirected) return { ok: true, redirected: true };
    // Local demo path: instant sign-in.
    if (res.data?.user) {
      setUser(res.data.user);
      notify('success', `Connected via Discord, ${res.data.user.name}!`);
      await refreshData();
    }
    return { ok: true };
  }, [notify, refreshData]);

  const register = useCallback(async (name: string, email: string, password: string, role: 'admin' | 'user') => {
    const res = await api.apiRegister(name, email, password, role);
    if (!res.ok) return { ok: false, error: res.error };
    // Real backend: account exists but needs email confirmation before sign-in
    if (res.data?.needsVerification) {
      return { ok: true, needsVerification: true };
    }
    // Local demo: signed in immediately
    if (res.data?.user) {
      setUser(res.data.user);
      notify('success', `Account created! Welcome, ${res.data.user.name}!`);
      await refreshData();
    }
    return { ok: true };
  }, [notify, refreshData]);

  const logout = useCallback(async () => {
    await api.apiLogout();
    setUser(null);
    setLikedItems(new Set());
    notify('info', 'Signed out.');
  }, [notify]);

  // ─── CRUD ───────────────────────────────────────────────────
  const addScenepack = useCallback(async (data: Partial<Scenepack>) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiCreateScenepack(user.id, data);
    if (res.ok) { await refreshData(); notify('success', 'Scenepack published!'); return { ok: true }; }
    return { ok: false, error: res.error };
  }, [user, refreshData, notify]);

  const addTutorial = useCallback(async (data: Partial<Tutorial>) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiCreateTutorial(user.id, data);
    if (res.ok) { await refreshData(); notify('success', 'Tutorial published!'); return { ok: true }; }
    return { ok: false, error: res.error };
  }, [user, refreshData, notify]);

  const addAudioTrack = useCallback(async (data: Partial<AudioTrack>) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiCreateAudioTrack(user.id, data);
    if (res.ok) { await refreshData(); notify('success', 'Audio track published!'); return { ok: true }; }
    return { ok: false, error: res.error };
  }, [user, refreshData, notify]);

  const deleteScenepack = useCallback(async (id: string) => {
    if (!user) return;
    await api.apiDeleteScenepack(user.id, id);
    await refreshData();
    notify('info', 'Scenepack removed.');
  }, [user, refreshData, notify]);

  const deleteTutorial = useCallback(async (id: string) => {
    if (!user) return;
    await api.apiDeleteTutorial(user.id, id);
    await refreshData();
    notify('info', 'Tutorial removed.');
  }, [user, refreshData, notify]);

  const download = useCallback(async (type: 'scenepack' | 'tutorial' | 'audio', id: string) => {
    if (!user) { notify('error', 'Please sign in to download.'); return; }
    const res = await api.apiDownload(user.id, type, id);
    if (res.ok) {
      // Trigger a REAL browser file download
      try {
        if (type === 'scenepack') {
          const pack = scenepacks.find((p) => p.id === id);
          if (pack) downloadScenepack(pack);
        } else if (type === 'tutorial') {
          const tut = tutorials.find((t) => t.id === id);
          if (tut) downloadTutorial(tut);
        } else if (type === 'audio') {
          const track = audioTracks.find((a) => a.id === id);
          if (track) downloadAudio(track);
        }
        notify('success', 'Download started — check your downloads folder!');
      } catch {
        notify('error', 'Download failed. Please try again.');
      }
      await refreshData();
    } else {
      notify('error', res.error || 'Download failed.');
    }
  }, [user, scenepacks, tutorials, audioTracks, refreshData, notify]);

  const toggleLike = useCallback(async (key: string) => {
    if (!user) { notify('error', 'Please sign in.'); return; }
    const res = await api.apiToggleLike(user.id, key);
    if (res.ok) {
      const likes = await api.apiGetLikes(user.id);
      if (likes.ok && likes.data) setLikedItems(new Set(likes.data));
    }
  }, [user, notify]);

  // ─── Chat ───────────────────────────────────────────────────
  const loadMessages = useCallback(async (roomId: string) => {
    const res = await api.apiGetMessages(roomId);
    if (res.ok && res.data) setChatMessages(res.data);
  }, []);

  const sendMessage = useCallback(async (roomId: string, content: string) => {
    if (!user) { notify('error', 'Please sign in to chat.'); return; }
    const res = await api.apiSendMessage(user.id, user.name, user.avatar, roomId, content);
    if (res.ok) await loadMessages(roomId);
  }, [user, loadMessages, notify]);

  // ─── Admin: user management ────────────────────────────────
  const listUsers = useCallback(async () => {
    if (!user) return [];
    const res = await api.apiListUsers(user.id);
    return res.ok && res.data ? res.data : [];
  }, [user]);

  const setUserRole = useCallback(async (targetUserId: string, newRole: 'admin' | 'user') => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiSetUserRole(user.id, targetUserId, newRole);
    if (res.ok) {
      notify('success', newRole === 'admin' ? 'User promoted to admin' : 'Admin demoted to member');
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, [user, notify]);

  const isAdmin = user?.role === 'admin';

  return (
    <Ctx.Provider value={{
      user, loading, scenepacks, tutorials, audioTracks, chatRooms, chatMessages,
      likedItems, notifications, stats,
      login, loginWithDiscord, register, logout, refreshData,
      addScenepack, addTutorial, addAudioTrack,
      deleteScenepack, deleteTutorial,
      download, toggleLike,
      sendMessage, loadMessages, notify,
      listUsers, setUserRole,
      isAdmin,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
}
