// ============================================================
// STARBOUNDSGRP — Simulated Database Engine
// This mirrors a real PostgreSQL/MongoDB backend.
// Replace loadTable/saveTable with real API calls when deploying.
// ============================================================

const DB_PREFIX = 'sgrp_db_';
const SCHEMA_KEY = 'sgrp_schema_version';
const CURRENT_SCHEMA = 2; // bump to wipe stale demo seed data from visitors' caches

// Run once per browser per schema version: clears any cached demo content
// from older builds so visitors see the real empty state.
(function migrate() {
  try {
    const v = parseInt(localStorage.getItem(SCHEMA_KEY) || '0', 10);
    if (v < CURRENT_SCHEMA) {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(DB_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(SCHEMA_KEY, String(CURRENT_SCHEMA));
    }
  } catch { /* ignore */ }
})();

export function loadTable<T>(tableName: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(DB_PREFIX + tableName);
    if (raw) return JSON.parse(raw);
    saveTable(tableName, defaults);
    return defaults;
  } catch {
    return defaults;
  }
}

export function saveTable<T>(tableName: string, data: T[]): void {
  localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(data));
}

export function loadRecord<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(DB_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveRecord<T>(key: string, data: T): void {
  localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
}

export function clearDatabase(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(DB_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
