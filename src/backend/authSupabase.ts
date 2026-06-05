// ============================================================
// STARBOUNDSGRP — Real Authentication via Supabase
// Email/password, real verification emails, Discord OAuth.
// ============================================================

import { supabase } from './supabase';
import type { User, Role } from './models';
import type { ApiResponse } from './api';

// Root admin(s). Any account created with one of these emails becomes admin
// automatically. From the Admin Panel → Users tab, the root admin can then
// invite more admins (those get added to the shared `admin_emails` Supabase
// table so every browser knows about them).
const ROOT_ADMIN_EMAILS = ['sarah.4univ@gmail.com'];

// In-memory cache of the shared admin_emails table, refreshed at boot.
let invitedAdminCache: Set<string> = new Set();
export function setInvitedAdminCache(emails: string[]) {
  invitedAdminCache = new Set(emails.map(e => e.toLowerCase()));
}
export function getCachedInvitedAdmins(): string[] {
  return Array.from(invitedAdminCache);
}

function ok<T>(data: T, status = 200): ApiResponse<T> { return { ok: true, data, status }; }
function ko(error: string, status = 400): ApiResponse<never> { return { ok: false, error, status }; }

function buildUser(authUser: any): User {
  const meta = authUser.user_metadata || {};
  const email = (authUser.email || '').toLowerCase();
  const name: string = meta.name || meta.full_name || meta.preferred_username || meta.user_name || email.split('@')[0] || 'Editor';
  const explicitRole = (meta.role as Role | undefined);
  const isInvited = invitedAdminCache.has(email);
  const isRoot = ROOT_ADMIN_EMAILS.includes(email);
  const role: Role = explicitRole === 'admin' || isRoot || isInvited ? 'admin' : 'user';
  return {
    id: authUser.id,
    name,
    email,
    passwordHash: '',
    role,
    avatar: (meta.avatar as string) || name.slice(0, 2).toUpperCase(),
    joinedAt: authUser.created_at || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: meta.bio || '',
    downloads: 0,
    isVerified: !!authUser.email_confirmed_at || !!authUser.confirmed_at,
    phone: meta.phone || authUser.phone || '',
  };
}

export async function sbLogin(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return ko(translateError(error.message), 401);
  if (!data.user) return ko('Sign-in failed.', 401);
  if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
    return ko('Please verify your email — check your inbox for the confirmation link.', 403);
  }
  return ok({ user: buildUser(data.user), token: data.session?.access_token || '' });
}

export async function sbRegister(name: string, email: string, password: string, role: Role): Promise<ApiResponse<{ user: User; token: string; needsVerification: boolean }>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  if (password.length < 6) return ko('Password must be at least 6 characters.', 400);
  if (!name.trim()) return ko('Display name is required.', 400);

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { name: name.trim(), role },
      emailRedirectTo: `${window.location.origin}`,
    },
  });
  if (error) return ko(translateError(error.message), 400);
  if (!data.user) return ko('Registration failed.', 400);

  const needsVerification = !data.session; // Supabase returns session only when email confirmation is OFF
  return ok({
    user: buildUser(data.user),
    token: data.session?.access_token || '',
    needsVerification,
  });
}

export async function sbLoginWithDiscord(): Promise<ApiResponse<{ redirected: boolean }>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  // We compute the URL ourselves and redirect the TOP window. This is critical
  // because Discord refuses to load in iframes (X-Frame-Options DENY), so any
  // preview/embedded context would otherwise show "discord.com refused to connect".
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}`,
      scopes: 'identify email',
      skipBrowserRedirect: true,
    },
  });
  if (error) return ko(error.message, 500);
  if (!data?.url) return ko('Failed to start Discord sign-in.', 500);
  // Try the top window first (escapes iframes). Fall back to current window.
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = data.url;
    } else {
      window.location.href = data.url;
    }
  } catch {
    // Cross-origin iframe — top is inaccessible. Open in a new tab instead.
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }
  return ok({ redirected: true });
}

export async function sbGetCurrentUser(): Promise<ApiResponse<User | null>> {
  if (!supabase) return ok(null);
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return ok(null);
  return ok(buildUser(data.session.user));
}

export async function sbLogout(): Promise<ApiResponse<boolean>> {
  if (!supabase) return ok(true);
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch { /* swallow — we'll force-clear below */ }
  // Belt-and-suspenders: nuke any cached Supabase tokens from storage
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-') || k.includes('supabase'))
      .forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
  return ok(true);
}

export async function sbResendVerification(email: string): Promise<ApiResponse<boolean>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: `${window.location.origin}` },
  });
  if (error) return ko(error.message, 400);
  return ok(true);
}

// ─── Password reset ─────────────────────────────────────────
export async function sbRequestPasswordReset(email: string): Promise<ApiResponse<boolean>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  // We add ?reset=1 as a fallback marker — even if the SDK misses the
  // PASSWORD_RECOVERY event for some reason, we can still detect we should
  // show the reset modal by reading the URL.
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/?reset=1`,
  });
  if (error) return ko(translateError(error.message), 400);
  return ok(true);
}

export async function sbUpdatePassword(newPassword: string): Promise<ApiResponse<boolean>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  if (newPassword.length < 6) return ko('Password must be at least 6 characters.', 400);
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return ko(translateError(error.message), 400);
  return ok(true);
}

// ─── Profile update ─────────────────────────────────────────
export async function sbUpdateProfile(updates: { name?: string; phone?: string; bio?: string; avatar?: string }): Promise<ApiResponse<User>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  const data: Record<string, any> = {};
  if (updates.name !== undefined)   data.name   = updates.name.trim();
  if (updates.phone !== undefined)  data.phone  = updates.phone.trim();
  if (updates.bio !== undefined)    data.bio    = updates.bio.trim();
  if (updates.avatar !== undefined) data.avatar = updates.avatar.trim().slice(0, 4).toUpperCase();

  // We only store everything in user_metadata (the `data` field).
  // Do NOT pass `phone` at the top level — Supabase requires an SMS provider
  // for that and would reject the whole update.
  const { data: res, error } = await supabase.auth.updateUser({ data });
  if (error) return ko(translateError(error.message), 400);
  if (!res.user) return ko('Update failed.', 500);
  return ok(buildUser(res.user));
}

export async function sbUpdateEmail(newEmail: string): Promise<ApiResponse<boolean>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
  if (error) return ko(translateError(error.message), 400);
  return ok(true);
}

// ─── Admin invitation ───────────────────────────────────────
export async function sbInviteAdmin(email: string): Promise<ApiResponse<boolean>> {
  if (!supabase) return ko('Supabase not configured.', 500);
  const lower = email.trim().toLowerCase();
  if (!lower.includes('@') || lower.length < 5) return ko('Invalid email address.', 400);

  // 1) Persist the invite in a SHARED Supabase table so every browser knows
  //    this email is admin. The buildUser() function then picks it up at sign-in.
  const { error: insErr } = await supabase
    .from('admin_emails')
    .upsert({ email: lower }, { onConflict: 'email' });
  if (insErr) {
    // If the table doesn't exist yet, give a friendly setup hint.
    if (insErr.message?.toLowerCase().includes('relation') || insErr.code === '42P01') {
      return ko('Admin invites need a one-time Supabase setup. See SETUP_SUPABASE.md.', 500);
    }
    return ko(insErr.message || 'Could not save invite.', 500);
  }

  // 2) Update local cache immediately so the current admin sees it work
  invitedAdminCache.add(lower);

  // 3) Try to send a magic link too (optional — invite is already valid).
  //    If this fails (rate-limit, template missing, etc.) we still succeed
  //    because the user can just sign up normally with that email.
  try {
    await supabase.auth.signInWithOtp({
      email: lower,
      options: {
        data: { invitedAsAdmin: true, role: 'admin' },
        emailRedirectTo: `${window.location.origin}`,
        shouldCreateUser: true,
      },
    });
  } catch { /* magic-link is a nice-to-have */ }

  return ok(true);
}

// Fetch shared admin emails from Supabase and refresh the local cache.
// Called once at app boot from AppContext.
export async function sbFetchAdminEmails(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('admin_emails').select('email');
  if (error || !data) return [];
  const list = data.map((r: any) => (r.email as string).toLowerCase());
  setInvitedAdminCache(list);
  return list;
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please verify your email first — check your inbox.';
  if (m.includes('user already registered') || m.includes('already been registered')) return 'An account with this email already exists.';
  if (m.includes('password should be')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a minute.';
  return msg;
}
