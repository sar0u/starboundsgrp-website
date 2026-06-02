import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Film, BookOpen, Music, MessageCircle, Home, Users, Shield, LogOut, Sparkles, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  currentPage: number;
  onNavigate: (p: number) => void;
  onLogin: () => void;
  isAdmin: boolean;
}

const nav = [
  { label: 'Home',        icon: Home,           p: 0 },
  { label: 'Scenepacks',  icon: Film,           p: 1 },
  { label: 'Tutorials',   icon: BookOpen,       p: 2 },
  { label: 'Lounge',      icon: Users,          p: 3 },
  { label: 'Audio',       icon: Music,          p: 4 },
  { label: 'Consulting',  icon: MessageCircle,  p: 5 },
];

export default function Navbar({ currentPage, onNavigate, onLogin, isAdmin }: Props) {
  const { user, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const go = (p: number) => { onNavigate(p); setMenuOpen(false); };

  // Close popups on outside click
  useEffect(() => {
    if (!userMenuOpen && !menuOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-nav-popup]')) {
        setUserMenuOpen(false);
        setMenuOpen(false);
      }
    };
    const id = setTimeout(() => addEventListener('click', close), 0);
    return () => { clearTimeout(id); removeEventListener('click', close); };
  }, [userMenuOpen, menuOpen]);

  // Close on resize past breakpoints
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-fixed flex items-center px-3 sm:px-5 bg-gradient-to-b from-cream via-cream/95 to-transparent">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3" data-nav-popup>
        {/* Logo */}
        <button
          onClick={() => go(0)}
          className="flex items-center gap-2 sm:gap-2.5 shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl btn-primary flex items-center justify-center shadow-lg shadow-gold/30">
            <span className="text-white font-extrabold text-lg">S</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-gradient special-font hidden sm:block">Starbounds</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 bg-white/90 backdrop-blur-xl rounded-2xl px-1.5 py-1 shadow-lg shadow-gold/8 border border-gold-pale">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = currentPage === n.p;
            return (
              <button
                key={n.p}
                onClick={() => onNavigate(n.p)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${active ? 'text-white' : 'text-ink-muted hover:text-tangerine'}`}
              >
                {active && <motion.div layoutId="pill" className="absolute inset-0 btn-primary rounded-xl" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
                <span className="relative z-10 flex items-center gap-1.5"><Icon size={15} />{n.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-pale border border-sun text-xs font-bold text-tangerine-dark">
                  <Shield size={11} /> ADMIN
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white border border-gold-pale hover:border-gold transition-colors shadow"
                >
                  <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {user.avatar}
                  </div>
                  <div className="hidden md:block text-left max-w-[120px]">
                    <div className="text-sm font-bold text-ink leading-tight truncate">{user.name}</div>
                    <div className="text-[10px] text-ink-muted leading-tight">{isAdmin ? 'Administrator' : 'Member'}</div>
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: .96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: .96 }}
                      transition={{ duration: .15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gold-pale overflow-hidden z-50"
                    >
                      <div className="p-3 bg-sun-pale border-b border-gold-pale flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg btn-primary flex items-center justify-center text-white font-bold text-xs shrink-0">{user.avatar}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-ink truncate">{user.name}</div>
                          <div className="text-[10px] text-ink-muted flex items-center gap-1">
                            {isAdmin ? <><Shield size={9} /> Admin</> : <><Sparkles size={9} /> Member</>}
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => { setUserMenuOpen(false); onLogin(); }} className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-ink-muted hover:bg-sun-pale hover:text-tangerine transition-colors">
                          <Sparkles size={13} /> Admin Panel
                        </button>
                      )}
                      <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={13} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl btn-primary text-sm shadow-lg shadow-gold/25"
            >
              <LogIn size={15} /> <span className="hidden xs:inline sm:inline">Sign In</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            className="lg:hidden w-10 h-10 rounded-xl bg-white border border-gold-pale flex items-center justify-center text-tangerine shadow"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            data-nav-popup
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: .18 }}
            className="lg:hidden absolute top-full left-3 right-3 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-gold-pale grid grid-cols-2 gap-1.5"
          >
            {nav.map((n) => {
              const Icon = n.icon;
              const active = currentPage === n.p;
              return (
                <button
                  key={n.p}
                  onClick={() => go(n.p)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${active ? 'btn-primary text-white' : 'text-ink-muted hover:bg-sun-pale'}`}
                >
                  <Icon size={16} /> {n.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
