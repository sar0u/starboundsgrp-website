// ============================================================
// STARBOUNDSGRP — Real Authentication via Supabase
// Email/password, real verification emails, Discord OAuth.
// ============================================================

import { supabase } from './supabase';
import type { User, Role } from './models';
import type { ApiResponse } from './api';

const ADMIN_EMAILS = ['admin@starbound.com']; // anyone in this list gets admin role

function ok<T>(data: T, status = 200): ApiResponse<T> { return { ok: true, data, status }; }
function ko(error: string, status = 400): ApiResponse<never> { return { ok: false, error, status }; }

function buildUser(authUser: any): User {
  const meta = authUser.user_metadata || {};
  const email = (authUser.email || '').toLowerCase();
  const name: string = meta.name || meta.full_name || meta.preferred_username || meta.user_name || email.split('@')[0] || 'Editor';
  const explicitRole = (meta.role as Role | undefined);
  const role: Role = explicitRole === 'admin' || ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
  return {
    id: authUser.id,
    name,
    email,
    passwordHash: '', // never stored client-side with Supabase
    role,
    avatar: name.slice(0, 2).toUpperCase(),
    joinedAt: authUser.created_at || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: meta.bio || '',
    downloads: 0,
    isVerified: !!authUser.email_confirmed_at || !!authUser.confirmed_at,
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
  await supabase.auth.signOut();
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

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please verify your email first — check your inbox.';
  if (m.includes('user already registered') || m.includes('already been registered')) return 'An account with this email already exists.';
  if (m.includes('password should be')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a minute.';
  return msg;
}
