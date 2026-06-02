// ============================================================
// STARBOUNDSGRP — File Storage Layer
// ============================================================
// Two modes:
//   1) Direct upload to Supabase Storage (small/medium files)
//   2) External URL (Google Drive, Mega, Dropbox, S3, R2...)
//      → unlimited file size, never crashes the browser
// ============================================================

import { supabase, isSupabaseEnabled } from './supabase';

export const MAX_DIRECT_UPLOAD_MB = 50;        // Supabase free tier per-file limit
export const HARD_BLOCK_MB = 500;              // Refuse to even attempt above this

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  fileName?: string;
  fileSize?: string;
  error?: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function isValidExternalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

/**
 * Upload a file to Supabase Storage with progress reporting.
 * Uses XMLHttpRequest directly against the Storage REST API so we get
 * real upload progress (the JS SDK doesn't expose it).
 *
 * Wrapped in try/catch — will NEVER crash, always returns {ok: false} on error.
 */
export async function uploadToSupabase(
  bucket: 'scenepacks' | 'tutorials' | 'audio',
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  try {
    if (!isSupabaseEnabled || !supabase) {
      return { ok: false, error: 'Supabase not configured. Use an external URL instead.' };
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > HARD_BLOCK_MB) {
      return { ok: false, error: `File too large (${formatBytes(file.size)}). Use an external URL for files over ${HARD_BLOCK_MB}MB.` };
    }
    if (sizeMB > MAX_DIRECT_UPLOAD_MB) {
      return { ok: false, error: `File exceeds ${MAX_DIRECT_UPLOAD_MB}MB Supabase free-tier limit. Use an external URL or upgrade Supabase.` };
    }

    const safeName = `${Date.now()}_${slug(file.name)}`;
    const filePath = `${bucket}/${safeName}`;

    // Get auth headers from the active session
    const { data: { session } } = await supabase.auth.getSession();
    const apiKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;
    const supaUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
    if (!apiKey || !supaUrl) return { ok: false, error: 'Missing Supabase configuration.' };

    const uploadUrl = `${supaUrl}/storage/v1/object/${bucket}/${safeName}`;

    // Use XHR for real progress events
    const result: UploadResult = await new Promise<UploadResult>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('apikey', apiKey);
      xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token || apiKey}`);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({ loaded: e.loaded, total: e.total, percent: Math.round((e.loaded / e.total) * 100) });
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const publicUrl = `${supaUrl}/storage/v1/object/public/${bucket}/${safeName}`;
          resolve({ ok: true, url: publicUrl, fileName: file.name, fileSize: formatBytes(file.size) });
        } else {
          let msg = `Upload failed (${xhr.status})`;
          try { const j = JSON.parse(xhr.responseText); if (j.message) msg = j.message; } catch {/* ignore */}
          resolve({ ok: false, error: msg });
        }
      };
      xhr.onerror = () => resolve({ ok: false, error: 'Network error during upload.' });
      xhr.onabort = () => resolve({ ok: false, error: 'Upload cancelled.' });
      xhr.send(file);
      void filePath; // referenced for clarity
    });

    return result;
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unexpected upload error.' };
  }
}

/**
 * Trigger a real browser download.
 * - If url is hosted by us (Supabase or our domain): download attribute works
 * - Else (external like Mega/Drive/Dropbox): opens in new tab so user
 *   can grab the file from the hosting site (avoids CORS issues that would
 *   otherwise crash).
 */
export function streamDownload(url: string, suggestedName?: string) {
  try {
    const sameOrigin = url.startsWith(window.location.origin) ||
      (isSupabaseEnabled && url.startsWith((import.meta as any).env.VITE_SUPABASE_URL || ''));
    if (sameOrigin) {
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedName || '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch {
    // Last-resort fallback
    try { window.open(url, '_blank'); } catch { /* swallow */ }
  }
}
