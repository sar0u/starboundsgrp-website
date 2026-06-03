import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function LoadingScreen() {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    // After 3 seconds, surface a "Reload" escape hatch so the user is never
    // locked out if the network is slow or Supabase is down.
    const t = setTimeout(() => setShowRetry(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center scene-bg px-4">
      <motion.div initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl btn-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/30 animate-glow-ring">
          <span className="text-white font-extrabold text-2xl">S</span>
        </div>
        <p className="text-ink-muted font-semibold mb-1">Loading starboundsgrp…</p>
        {showRetry && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
            <p className="text-xs text-ink-muted max-w-xs mx-auto">
              Taking longer than usual. The backend may be waking up.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-bold shadow active:scale-95 transition"
            >
              <RefreshCw size={14} /> Reload
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
