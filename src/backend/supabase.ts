// ============================================================
// STARBOUNDSGRP — Supabase Client (Optional Real Backend)
// ============================================================
// If you set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in
// your environment (.env file or your host's env vars), the app
// uses Supabase for REAL authentication, email verification, and
// Discord OAuth. Otherwise it falls back to the local demo mode.
//
// See DEPLOYMENT.md for the complete setup guide.
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseEnabled: boolean =
  !!SUPABASE_URL && !!SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('https://');

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // for OAuth callbacks
      },
    })
  : null;

if (isSupabaseEnabled) {
  // eslint-disable-next-line no-console
  console.log('%c[starboundsgrp] Supabase backend enabled ✓', 'color:#FF7A00;font-weight:bold');
} else {
  // eslint-disable-next-line no-console
  console.log('%c[starboundsgrp] Running in local demo mode (no Supabase configured)', 'color:#888');
}
