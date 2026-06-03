import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, X, ExternalLink } from 'lucide-react';
import { isSupabaseEnabled } from '../backend/supabase';

/**
 * Detects if the Supabase backend is unreachable and shows a non-blocking
 * banner so the user immediately knows why things feel slow or unresponsive.
 */
export default function BackendStatus() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled) return;

    let cancelled = false;
    const url = (import.meta as any).env.VITE_SUPABASE_URL as string;

    const check = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4500);
        const res = await fetch(`${url}/auth/v1/health`, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!cancelled) setOffline(!res.ok);
      } catch {
        if (!cancelled) setOffline(true);
      }
    };

    check();
    const interval = setInterval(check, 30000); // re-check every 30s

    // Also re-check when user comes back to the tab
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && !dismissed && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg"
        >
          <div className="max-w-5xl mx-auto px-3 py-2.5 flex items-center gap-3">
            <WifiOff size={18} className="shrink-0" />
            <div className="flex-1 min-w-0 text-xs sm:text-sm">
              <span className="font-bold">Backend unreachable.</span>{' '}
              <span className="opacity-90">Sign-in &amp; saves won't work. The Supabase project may be paused — </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank" rel="noopener noreferrer"
                className="underline font-bold inline-flex items-center gap-1"
              >
                restore it <ExternalLink size={11} />
              </a>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 p-1 rounded hover:bg-white/20 transition"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
