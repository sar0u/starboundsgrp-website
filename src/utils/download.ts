// ============================================================
// STARBOUNDSGRP — Download Dispatcher
// If the content has a real `fileUrl` (uploaded by an admin or
// pasted as an external link) → stream it.
// Otherwise → generate a sample/manifest file as a graceful fallback.
// All operations wrapped in try/catch so the browser NEVER crashes.
// ============================================================

import { streamDownload } from '../backend/storage';

function triggerBlobDownload(filename: string, blob: Blob) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch {/* never crash */}
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Scenepack ───────────────────────────────────────────────
export function downloadScenepack(pack: {
  title: string; category: string; resolution: string; clips: number;
  duration: string; tags: string[]; description: string; authorName: string; fileSize: string;
  fileUrl?: string; fileName?: string;
}) {
  if (pack.fileUrl) {
    streamDownload(pack.fileUrl, pack.fileName || `${slug(pack.title)}-scenepack`);
    return;
  }
  // Fallback manifest for default/seed entries
  const content = `STARBOUNDSGRP — SCENEPACK PACKAGE

TITLE      : ${pack.title}
CATEGORY   : ${pack.category}
RESOLUTION : ${pack.resolution}
CLIPS      : ${pack.clips}
DURATION   : ${pack.duration}
SIZE       : ${pack.fileSize}
AUTHOR     : ${pack.authorName}
TAGS       : ${pack.tags.join(', ')}

${pack.description}

This is a sample manifest. The full asset isn't yet attached for this entry.
Downloaded: ${new Date().toLocaleString()}
`;
  triggerBlobDownload(`${slug(pack.title)}-scenepack.txt`, new Blob([content], { type: 'text/plain' }));
}

// ─── Tutorial ────────────────────────────────────────────────
export function downloadTutorial(tut: {
  title: string; category: string; level: string; duration: string;
  description: string; author: string;
  fileUrl?: string; fileName?: string;
}) {
  if (tut.fileUrl) {
    streamDownload(tut.fileUrl, tut.fileName || `${slug(tut.title)}-guide`);
    return;
  }
  const content = `STARBOUNDSGRP — TUTORIAL QUICK-GUIDE

${tut.title.toUpperCase()}

CATEGORY : ${tut.category}
LEVEL    : ${tut.level}
DURATION : ${tut.duration}
AUTHOR   : ${tut.author}

${tut.description}

Downloaded: ${new Date().toLocaleString()}
`;
  triggerBlobDownload(`${slug(tut.title)}-guide.txt`, new Blob([content], { type: 'text/plain' }));
}

// ─── Audio ───────────────────────────────────────────────────
export function downloadAudio(track: {
  title: string; artist: string; bpm: number; duration: string; category: string;
  fileUrl?: string; fileName?: string;
}) {
  if (track.fileUrl) {
    streamDownload(track.fileUrl, track.fileName || `${slug(track.title)}.audio`);
    return;
  }
  // Synth fallback — short generated tone
  try {
    const parts = track.duration.split(':').map(Number);
    const totalSec = parts.length === 2 ? parts[0] * 60 + parts[1] : 4;
    const seconds = Math.min(Math.max(totalSec, 2), 6);
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * seconds);
    const dataSize = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const ws = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
    ws(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    ws(36, 'data'); view.setUint32(40, dataSize, true);
    const beatDur = 60 / track.bpm;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0];
    let off = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = Math.floor(t / beatDur);
      const freq = scale[beat % scale.length];
      const envT = (t % beatDur) / beatDur;
      const env = Math.exp(-3 * envT);
      const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.35;
      view.setInt16(off, Math.max(-1, Math.min(1, sample)) * 32767, true);
      off += 2;
    }
    triggerBlobDownload(`${slug(track.title)}-${track.bpm}bpm.wav`, new Blob([buffer], { type: 'audio/wav' }));
  } catch {/* swallow */}
}
