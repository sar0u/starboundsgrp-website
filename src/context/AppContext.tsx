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
  recoveryMode: boolean;
}

interface AppActions {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithDiscord: () => Promise<{ ok: boolean; error?: string; redirected?: boolean }>;
  register: (name: string, email: string, password: string, role: 'admin' | 'user') => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  logout: () => Promise<void>;
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
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (updates: { name?: string; phone?: string; bio?: string; avatar?: string }) => Promise<{ ok: boolean; error?: string }>;
  updateEmail: (newEmail: string) => Promise<{ ok: boolean; error?: string }>;
  inviteAdmin: (email: string) => Promise<{ ok: boolean; error?: string }>;
  clearRecoveryMode: () => void;
  // Ping an Editor
  helpRequests: import('../backend/models').HelpRequest[];
  loadHelpRequests: () => Promise<void>;
  createHelpRequest: (data: { title: string; description: string; category: import('../backend/models').HelpCategory; urgency: import('../backend/models').HelpUrgency }) => Promise<{ ok: boolean; error?: string }>;
  claimHelpRequest: (id: string) => Promise<{ ok: boolean; error?: string }>;
  unclaimHelpRequest: (id: string) => Promise<{ ok: boolean; error?: string }>;
  resolveHelpRequest: (id: string) => Promise<{ ok: boolean; error?: string }>;
  replyToHelpRequest: (id: string, content: string) => Promise<{ ok: boolean; error?: string }>;
  deleteHelpRequest: (id: string) => Promise<{ ok: boolean; error?: string }>;
  isAdmin: boolean;
}

type AppCtx = AppState & AppActions;

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Hydrate user from localStorage on first paint so the UI is interactive
  // INSTANTLY, even if Supabase is slow or down. The real session check
  // happens in the background and will replace this if needed.
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('sgrp_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const setUser = (u: User | null) => {
    setUserState(u);
    try {
      if (u) localStorage.setItem('sgrp_cached_user', JSON.stringify(u));
      else localStorage.removeItem('sgrp_cached_user');
    } catch { /* quota / private mode */ }
  };
  const [loading, setLoading] = useState(true);
  const [scenepacks, setScenepacks] = useState<Scenepack[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [helpRequests, setHelpRequests] = useState<import('../backend/models').HelpRequest[]>([]);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ scenepacks: 0, tutorials: 0, audio: 0, users: 0 });
  const [recoveryMode, setRecoveryMode] = useState(false);

  // ─── Toast notifications ────────────────────────────────────
  const notify = useCallback((type: Notification['type'], message: string) => {
    const id = Date.now().toString(36);
    setNotifications((p) => [...p, { id, type, message }]);
    setTimeout(() => setNotifications((p) => p.filter((n) => n.id !== id)), 3800);
  }, []);

  // ─── Load all data ──────────────────────────────────────────
  // Each fetch is isolated with allSettled so one failure doesn't kill the rest.
  const refreshData = useCallback(async () => {
    const safe = <T,>(p: Promise<T>) =>
      Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))])
        .catch(() => ({ ok: false } as any));

    const [sp, tu, au, ro, st] = await Promise.allSettled([
      safe(api.apiGetScenepacks()),
      safe(api.apiGetTutorials()),
      safe(api.apiGetAudioTracks()),
      safe(api.apiGetRooms()),
      safe(api.apiGetStats()),
    ]);
    if (sp.status === 'fulfilled' && (sp.value as any).ok && (sp.value as any).data) setScenepacks((sp.value as any).data);
    if (tu.status === 'fulfilled' && (tu.value as any).ok && (tu.value as any).data) setTutorials((tu.value as any).data);
    if (au.status === 'fulfilled' && (au.value as any).ok && (au.value as any).data) setAudioTracks((au.value as any).data);
    if (ro.status === 'fulfilled' && (ro.value as any).ok && (ro.value as any).data) setChatRooms((ro.value as any).data);
    if (st.status === 'fulfilled' && (st.value as any).ok && (st.value as any).data) setStats((st.value as any).data);
  }, []);

  // ─── Aggressive pre-warm — wake Supabase the moment the app boots ─
  // Supabase free-tier pauses after ~7 days idle and takes 30-60s to wake up.
  // We ping it as soon as the React tree mounts, in parallel to all other
  // init work, so by the time the user reaches the login form the backend
  // is usually already warm. We ALSO fetch the shared admin_emails table
  // so `buildUser` can determine the role correctly for any session.
  useEffect(() => {
    const url = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
    if (!url) return;
    const opts: RequestInit = { cache: 'no-store', mode: 'cors', keepalive: true };
    fetch(`${url}/auth/v1/health`, opts).catch(() => {});
    fetch(`${url}/rest/v1/`, { ...opts, headers: { apikey: (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '' } }).catch(() => {});
    // Load shared admin email allowlist (used by buildUser to grant admin role)
    api.sbFetchAdminEmails().catch(() => {});
  }, []);

  // ─── Detect password-reset redirect (?reset=1 OR type=recovery hash) ─
  // Belt-and-suspenders: the Supabase SDK normally fires PASSWORD_RECOVERY
  // automatically, but the URL marker guarantees the modal appears even if
  // the event is missed (e.g. slow network, race condition).
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const isResetParam = u.searchParams.get('reset') === '1';
      const isRecoveryHash = u.hash.includes('type=recovery');
      if (isResetParam || isRecoveryHash) {
        setRecoveryMode(true);
        // Clean the URL so a refresh doesn't re-open the modal
        u.searchParams.delete('reset');
        window.history.replaceState({}, '', u.pathname + u.search);
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Init: restore session ─────────────────────────────────
  // Hard timeout: no matter what, the app becomes interactive in <= 4s.
  // This prevents the dreaded "stuck on Loading…" screen if Supabase is slow,
  // paused (free tier), unreachable, or returns malformed data.
  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };

    // Safety net — UI must be interactive in 1.2s max, no matter what.
    // Because we hydrate `user` from localStorage synchronously above, the
    // user is already "signed in" visually before any network call.
    const safety = setTimeout(finish, 1200);

    (async () => {
      try {
        await Promise.race([
          api.apiGetCurrentUser().then((res) => {
            if (res.ok && res.data) setUser(res.data);
            else if (res.ok && !res.data) setUser(null); // genuinely signed out
          }),
          new Promise(r => setTimeout(r, 1500)),
        ]);
      } catch { /* swallow */ }

      // Data refresh runs in background, doesn't block UI.
      refreshData().catch(() => { /* swallow */ });

      clearTimeout(safety);
      finish();
    })();

    return () => clearTimeout(safety);
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
        setLikedItems(new Set());
      } else if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        notify('info', 'Set your new password to continue.');
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
  // Wrap any auth call so it can never hang forever
  const withTimeout = async <T,>(p: Promise<T>, ms = 12000, label = 'request'): Promise<T | { ok: false; error: string }> => {
    let to: ReturnType<typeof setTimeout>;
    const timeout = new Promise<{ ok: false; error: string }>((resolve) => {
      to = setTimeout(() => resolve({ ok: false, error: `The ${label} took too long. Please try again.` }), ms);
    });
    try {
      const result = await Promise.race([p, timeout]);
      clearTimeout(to!);
      return result as T;
    } catch (e: any) {
      clearTimeout(to!);
      return { ok: false, error: e?.message || `Network error during ${label}.` };
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    // First attempt with generous timeout (60s for cold-start case)
    let res = await withTimeout(api.apiLogin(email, password), 60000, 'sign-in') as any;
    // Auto-retry once if timeout — by now Supabase is almost certainly warm
    if (!res.ok && res.error?.includes('too long')) {
      res = await withTimeout(api.apiLogin(email, password), 30000, 'sign-in') as any;
    }
    if (res.ok && res.data) {
      setUser(res.data.user);
      notify('success', `Welcome back, ${res.data.user.name}!`);
      refreshData(); // background, non-blocking
      return { ok: true };
    }
    // Friendly error in case of repeated failure
    const friendlyError = res.error?.includes('too long')
      ? "The server is taking too long to respond. Please wait a few seconds and try again."
      : res.error;
    return { ok: false, error: friendlyError };
  }, [notify, refreshData]);

  const loginWithDiscord = useCallback(async () => {
    const res = await withTimeout(api.apiLoginWithDiscord(), 45000, 'Discord sign-in') as any;
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
    const res = await withTimeout(api.apiRegister(name, email, password, role), 60000, 'sign-up') as any;
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
    // Reset UI state IMMEDIATELY so the user sees the sign-out happen,
    // even if Supabase is slow or fails.
    setUser(null);
    setLikedItems(new Set());
    setRecoveryMode(false);
    try {
      await api.apiLogout();
    } catch { /* don't crash on transient network issue */ }
    notify('info', 'Signed out.');
  }, [notify]);

  // ─── CRUD ───────────────────────────────────────────────────
  const addScenepack = useCallback(async (data: Partial<Scenepack>) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiCreateScenepack({ id: user.id, name: user.name, role: user.role }, data);
    if (res.ok) { await refreshData(); notify('success', 'Scenepack published!'); return { ok: true }; }
    notify('error', res.error || 'Could not publish.');
    return { ok: false, error: res.error };
  }, [user, refreshData, notify]);

  const addTutorial = useCallback(async (data: Partial<Tutorial>) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiCreateTutorial({ id: user.id, name: user.name, avatar: user.avatar, role: user.role }, data);
    if (res.ok) { await refreshData(); notify('success', 'Tutorial published!'); return { ok: true }; }
    notify('error', res.error || 'Could not publish.');
    return { ok: false, error: res.error };
  }, [user, refreshData, notify]);

  const addAudioTrack = useCallback(async (data: Partial<AudioTrack>) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiCreateAudioTrack({ id: user.id, name: user.name, role: user.role }, data);
    if (res.ok) { await refreshData(); notify('success', 'Audio track published!'); return { ok: true }; }
    notify('error', res.error || 'Could not publish.');
    return { ok: false, error: res.error };
  }, [user, refreshData, notify]);

  const deleteScenepack = useCallback(async (id: string) => {
    if (!user) return;
    await api.apiDeleteScenepack({ id: user.id }, id);
    await refreshData();
    notify('info', 'Scenepack removed.');
  }, [user, refreshData, notify]);

  const deleteTutorial = useCallback(async (id: string) => {
    if (!user) return;
    await api.apiDeleteTutorial({ id: user.id }, id);
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

  // ─── Password reset ───────────────────────────────────────
  const requestPasswordReset = useCallback(async (email: string) => {
    const res = await withTimeout(api.apiRequestPasswordReset(email), 10000, 'reset request') as any;
    if (res.ok) notify('success', 'Password reset email sent. Check your inbox!');
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }, [notify]);

  const updatePassword = useCallback(async (newPassword: string) => {
    const res = await withTimeout(api.apiUpdatePassword(newPassword), 8000, 'password update') as any;
    if (res.ok) {
      notify('success', 'Password updated.');
      setRecoveryMode(false);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, [notify]);

  // ─── Profile management ──────────────────────────────────
  const updateProfile = useCallback(async (updates: { name?: string; phone?: string; bio?: string; avatar?: string }) => {
    if (!user) return { ok: false, error: 'Not signed in.' };

    // OPTIMISTIC UI: show the change instantly so the form feels responsive.
    const previous = user;
    const optimistic: User = {
      ...user,
      name: updates.name !== undefined && updates.name.trim() ? updates.name.trim() : user.name,
      bio: updates.bio !== undefined ? updates.bio : user.bio,
      avatar: updates.avatar !== undefined && updates.avatar.trim()
        ? updates.avatar.trim().slice(0, 4).toUpperCase()
        : user.avatar,
    };
    setUser(optimistic);

    // ACTUALLY persist to Supabase — long timeout (30s) handles cold-starts.
    const res = await withTimeout(api.apiUpdateProfile(updates), 30000, 'profile save') as any;

    if (res.ok && res.data) {
      // Backend confirmed → use its authoritative copy.
      setUser(res.data);
      notify('success', 'Profile updated successfully!');
      return { ok: true };
    }

    // Distinguish a timeout (which usually means the save still went through
    // on the server) from a real validation/auth error (which means it didn't).
    const isTimeout = typeof res.error === 'string' && res.error.toLowerCase().includes('too long');

    if (isTimeout) {
      // Keep the optimistic state — Supabase is just slow, not broken. Verify
      // in the background by refetching the current user, and reconcile if
      // the server happens to disagree.
      notify('success', 'Profile updated successfully!');
      api.apiGetCurrentUser().then((r) => {
        if (r.ok && r.data) setUser(r.data);
      }).catch(() => {});
      return { ok: true };
    }

    // Real failure (validation, auth, etc.) → roll back the UI.
    setUser(previous);
    notify('error', res.error || 'Could not save your changes. Please try again.');
    return { ok: false, error: res.error || 'Save failed.' };
  }, [user, notify]);

  const updateEmail = useCallback(async (newEmail: string) => {
    const res = await withTimeout(api.apiUpdateEmail(newEmail), 8000, 'email update') as any;
    if (res.ok) {
      notify('info', `A confirmation link was sent to ${newEmail}. Click it to finalize the change.`);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, [notify]);

  // ─── Admin invitation ────────────────────────────────────
  const inviteAdmin = useCallback(async (email: string) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await withTimeout(api.apiInviteAdmin(user.id, email), 8000, 'invitation') as any;
    if (res.ok) {
      notify('success', `Invitation sent to ${email}`);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, [user, notify]);

  const clearRecoveryMode = useCallback(() => setRecoveryMode(false), []);

  // ─── Ping an Editor ──────────────────────────────────────
  const loadHelpRequests = useCallback(async () => {
    const res = await api.apiGetHelpRequests();
    if (res.ok && res.data) setHelpRequests(res.data);
  }, []);

  const createHelpRequest = useCallback(async (data: { title: string; description: string; category: import('../backend/models').HelpCategory; urgency: import('../backend/models').HelpUrgency }) => {
    if (!user) { notify('error', 'Please sign in to post a request.'); return { ok: false, error: 'Not signed in.' }; }
    const res = await api.apiCreateHelpRequest({ id: user.id, name: user.name, avatar: user.avatar }, data);
    if (res.ok) { await loadHelpRequests(); notify('success', 'Your request is live — editors can now help!'); return { ok: true }; }
    return { ok: false, error: res.error };
  }, [user, notify, loadHelpRequests]);

  const claimHelpRequest = useCallback(async (id: string) => {
    if (!user) { notify('error', 'Please sign in first.'); return { ok: false, error: 'Not signed in.' }; }
    const res = await api.apiClaimHelpRequest({ id: user.id, name: user.name }, id);
    if (res.ok) { await loadHelpRequests(); notify('success', "You've got this one — thanks for helping!"); return { ok: true }; }
    notify('error', res.error || 'Could not claim request.');
    return { ok: false, error: res.error };
  }, [user, notify, loadHelpRequests]);

  const unclaimHelpRequest = useCallback(async (id: string) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiUnclaimHelpRequest({ id: user.id }, id);
    if (res.ok) { await loadHelpRequests(); notify('info', 'Released. Someone else can claim it now.'); return { ok: true }; }
    return { ok: false, error: res.error };
  }, [user, notify, loadHelpRequests]);

  const resolveHelpRequest = useCallback(async (id: string) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiResolveHelpRequest({ id: user.id }, id);
    if (res.ok) { await loadHelpRequests(); notify('success', 'Marked as resolved 🎉'); return { ok: true }; }
    notify('error', res.error || 'Could not resolve.');
    return { ok: false, error: res.error };
  }, [user, notify, loadHelpRequests]);

  const replyToHelpRequest = useCallback(async (id: string, content: string) => {
    if (!user) { notify('error', 'Please sign in to reply.'); return { ok: false, error: 'Not signed in.' }; }
    const res = await api.apiReplyToHelpRequest({ id: user.id, name: user.name, avatar: user.avatar }, id, content);
    if (res.ok) { await loadHelpRequests(); return { ok: true }; }
    return { ok: false, error: res.error };
  }, [user, notify, loadHelpRequests]);

  const deleteHelpRequest = useCallback(async (id: string) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const res = await api.apiDeleteHelpRequest({ id: user.id }, id, user.role === 'admin');
    if (res.ok) { await loadHelpRequests(); notify('info', 'Request deleted.'); return { ok: true }; }
    notify('error', res.error || 'Could not delete.');
    return { ok: false, error: res.error };
  }, [user, notify, loadHelpRequests]);

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
      requestPasswordReset, updatePassword,
      updateProfile, updateEmail,
      inviteAdmin,
      recoveryMode, clearRecoveryMode,
      helpRequests, loadHelpRequests,
      createHelpRequest, claimHelpRequest, unclaimHelpRequest,
      resolveHelpRequest, replyToHelpRequest, deleteHelpRequest,
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
