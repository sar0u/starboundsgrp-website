import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import SpaceCloud from './components/SpaceCloud';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import ProfileModal from './components/ProfileModal';
import RecoveryModal from './components/RecoveryModal';
import Toast from './components/Toast';
import LoadingScreen from './components/LoadingScreen';
import BackendStatus from './components/BackendStatus';
import HomePage from './pages/HomePage';
import ScenepacksPage from './pages/ScenepacksPage';
import TutorialsPage from './pages/TutorialsPage';
import LoungePage from './pages/LoungePage';
import AudioPage from './pages/AudioPage';
import ConsultingPage from './pages/ConsultingPage';
import LoginPage from './pages/LoginPage';

const pages = [
  { id: 0, name: 'Home', component: HomePage },
  { id: 1, name: 'Scenepacks', component: ScenepacksPage },
  { id: 2, name: 'Tutorials', component: TutorialsPage },
  { id: 3, name: 'Lounge', component: LoungePage },
  { id: 4, name: 'Audio', component: AudioPage },
  { id: 5, name: 'Consulting', component: ConsultingPage },
];

// Simple horizontal slide — no 3D, no scale (prevents visual clipping)
const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }),
};

function AppContent() {
  const { user, isAdmin, loading } = useApp();
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const nav = useCallback((p: number) => {
    if (p === page) return;
    setDir(p > page ? 1 : -1);
    setPage(p);
    setShowLogin(false);
  }, [page]);

  const next = useCallback(() => { if (page < pages.length - 1) { setDir(1); setPage(p => p + 1); setShowLogin(false); } }, [page]);
  const prev = useCallback(() => { if (page > 0) { setDir(-1); setPage(p => p - 1); setShowLogin(false); } }, [page]);

  const onLoginBtn = useCallback(() => {
    if (user && isAdmin) setShowAdmin(true);
    else if (!user) setShowLogin(true);
  }, [user, isAdmin]);

  // Keyboard nav (desktop only)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (showLogin || showAdmin) return;
      const target = e.target as HTMLElement;
      // Ignore when typing in inputs
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, [next, prev, showLogin, showAdmin]);

  // Touch swipe — strict horizontal only, ignores vertical scrolls
  useEffect(() => {
    let sx = 0, sy = 0, isTracking = false;
    const ts = (e: TouchEvent) => {
      sx = e.changedTouches[0].screenX;
      sy = e.changedTouches[0].screenY;
      isTracking = true;
    };
    const te = (e: TouchEvent) => {
      if (!isTracking) return;
      isTracking = false;
      const dx = sx - e.changedTouches[0].screenX;
      const dy = sy - e.changedTouches[0].screenY;
      if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 2) {
        if (dx > 0) next(); else prev();
      }
    };
    addEventListener('touchstart', ts, { passive: true });
    addEventListener('touchend', te, { passive: true });
    return () => { removeEventListener('touchstart', ts); removeEventListener('touchend', te); };
  }, [next, prev]);

  if (loading) return <LoadingScreen />;

  const Comp = pages[page].component;
  const canPrev = page > 0;
  const canNext = page < pages.length - 1;

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden scene-bg">
      <SpaceCloud />
      <BackendStatus />
      <Toast />
      <Navbar currentPage={page} onNavigate={nav} onLogin={onLoginBtn} onProfile={() => setShowProfile(true)} isAdmin={!!isAdmin} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <RecoveryModal />

      {/* Admin FAB — only visible to admins, sits above the dots bar */}
      <AnimatePresence>
        {user && isAdmin && !showLogin && !showAdmin && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -180 }}
            whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: .92 }}
            onClick={() => setShowAdmin(true)}
            aria-label="Open admin panel"
            className="fixed right-4 sm:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full btn-primary shadow-2xl shadow-gold/40 flex items-center justify-center animate-glow-ring"
            style={{ bottom: 'calc(var(--footer-h) + env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
          >
            <Plus size={26} strokeWidth={2.5} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {user && isAdmin && <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />}

      {/* Page slot — every page is absolutely positioned & fills it */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          {showLogin ? (
            <motion.div key="login"
              initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}
              transition={{ duration: .22 }}
              className="absolute inset-0">
              <LoginPage onBack={() => setShowLogin(false)} />
            </motion.div>
          ) : (
            <motion.div key={page} custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ x: { type: 'spring', stiffness: 280, damping: 32 }, opacity: { duration: .2 } }}
              className="absolute inset-0">
              <Comp onNavigate={nav} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop nav arrows */}
      {!showLogin && (
        <>
          <button
            onClick={prev} aria-label="Previous page"
            className="hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-lg shadow-gold/15 items-center justify-center text-tangerine hover:scale-110 transition-transform border border-gold-pale"
            style={{ opacity: canPrev ? 1 : 0, pointerEvents: canPrev ? 'auto' : 'none' }}
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <button
            onClick={next} aria-label="Next page"
            className="hidden md:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-lg shadow-gold/15 items-center justify-center text-tangerine hover:scale-110 transition-transform border border-gold-pale"
            style={{ opacity: canNext ? 1 : 0, pointerEvents: canNext ? 'auto' : 'none' }}
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Bottom footer zone (dots) — single fixed bar, never overlaps content */}
      {!showLogin && (
        <div
          className="fixed left-0 right-0 bottom-0 z-30 flex items-end justify-center pointer-events-none"
          style={{ height: 'calc(var(--footer-h) + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="pointer-events-auto mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-gold-pale shadow-sm">
            {pages.map((p) => (
              <button
                key={p.id} onClick={() => nav(p.id)}
                aria-label={`Go to ${p.name}`}
                className={`h-2 rounded-full transition-all duration-300 ${page === p.id ? 'w-7 btn-primary' : 'w-2 bg-ash hover:bg-gold'}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
