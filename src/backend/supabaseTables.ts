// ============================================================
// STARBOUNDSGRP — Supabase Tables Layer for Shared Content
// ============================================================
// Generic helpers to read/write JSONB-backed rows in Supabase so
// all visitors see the same content (vs localStorage which is per-browser).
//
// One-time SQL setup (see SETUP_SUPABASE.md):
//   create table public.scenepacks   (id text primary key, data jsonb not null, created_at timestamptz default now());
//   create table public.tutorials    (id text primary key, data jsonb not null, created_at timestamptz default now());
//   create table public.audio_tracks (id text primary key, data jsonb not null, created_at timestamptz default now());
//   create table public.help_requests(id text primary key, data jsonb not null, created_at timestamptz default now());
//   create table public.admin_emails (email text primary key, invited_at timestamptz default now());
// ============================================================

import { supabase } from './supabase';

type Table = 'scenepacks' | 'tutorials' | 'audio_tracks' | 'help_requests';

export async function tableList<T extends { id: string }>(table: Table): Promise<T[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(table)
    .select('data, created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => r.data as T);
}

export async function tableInsert<T extends { id: string }>(table: Table, row: T): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured.' };
  const { error } = await supabase.from(table).insert({ id: row.id, data: row });
  if (error) {
    if (error.code === '42P01') return { ok: false, error: `Table "${table}" not found. Run the SQL in SETUP_SUPABASE.md.` };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function tableUpdate<T extends { id: string }>(table: Table, row: T): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured.' };
  const { error } = await supabase.from(table).update({ data: row }).eq('id', row.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function tableDelete(table: Table, id: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured.' };
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
