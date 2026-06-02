import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Star, Play, Clock, ChevronRight, Heart, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ScenepacksPage() {
  const { scenepacks, download, likedItems, toggleLike, isAdmin, deleteScenepack } = useApp();
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<any>(null);

  const cats = ['All', ...Array.from(new Set(scenepacks.map(p => p.category)))];
  const list = scenepacks.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (p.title.toLowerCase().includes(q.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(q.toLowerCase())))
  );

  return (
    <div className="page-shell">
      <div className="page-inner">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient mb-1.5">Scenepacks</h2>
          <p className="text-ink-muted text-sm sm:text-base md:text-lg">Premium footage collections for your next project</p>
        </motion.div>

        {/* Search + filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
            <input
              type="text" placeholder="Search scenepacks…" value={q} onChange={(e) => setQ(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-white border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${cat === c ? 'btn-primary shadow-md' : 'bg-white border border-ash text-ink-muted hover:border-gold'}`}>
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => {
              const liked = likedItems.has(`scenepack_${p.id}`);
              return (
                <motion.div
                  key={p.id} layout
                  initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .94 }}
                  transition={{ delay: i * .03, type: 'spring', stiffness: 300, damping: 28 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSel(p)}
                  className="glass rounded-2xl overflow-hidden cursor-pointer flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-sun-pale via-gold-pale to-cream-warm" />
                    <div className="absolute inset-0 opacity-50">
                      <div className="absolute top-3 left-3 w-16 h-16 rounded-full bg-sun/30 animate-drift" />
                      <div className="absolute bottom-3 right-3 w-14 h-14 rounded-full bg-gold/25 animate-float" />
                    </div>
                    <Play size={40} className="text-tangerine/60 relative z-10 drop-shadow-lg" />
                    {p.isPremium && <div className="absolute top-3 right-3 premium-badge shadow">★ PREMIUM</div>}
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-sm text-[11px] font-bold text-ink">{p.resolution}</div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="tag">{p.category}</span>
                      <div className="flex items-center gap-1 text-xs text-ink-muted"><Star size={12} className="text-sun fill-sun" />{p.rating}</div>
                    </div>
                    <h3 className="font-bold text-ink text-base sm:text-lg mb-1 line-clamp-2">{p.title}</h3>
                    <p className="text-xs text-ink-muted mb-3 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-3 text-xs text-ink-muted mb-3 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={13} />{p.duration}</span>
                      <span>{p.clips} clips</span>
                      <span>{p.fileSize}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {p.tags.slice(0, 3).map(t => <span key={t} className="tag-outline">{t}</span>)}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <span className="text-xs text-ink-muted flex items-center gap-1 shrink-0"><Download size={13} />{p.downloads.toLocaleString()}</span>
                      <div className="flex gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(`scenepack_${p.id}`); }}
                          className={`p-2 rounded-lg transition active:scale-95 ${liked ? 'bg-red-50 text-red-500' : 'bg-sun-pale/50 text-ink-muted hover:text-red-500'}`}>
                          <Heart size={14} className={liked ? 'fill-current' : ''} />
                        </button>
                        {isAdmin && (
                          <button onClick={(e) => { e.stopPropagation(); deleteScenepack(p.id); }}
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition active:scale-95">
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); download('scenepack', p.id); }}
                          className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl btn-primary text-xs sm:text-sm shadow active:scale-95 transition">
                          Download <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {list.length === 0 && (
          <div className="text-center py-16 text-ink-muted">
            No scenepacks found. Try a different search or category.
          </div>
        )}

        {/* Detail modal */}
        <AnimatePresence>
          {sel && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSel(null)}
              className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: .94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .94, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl border-2 border-gold-pale max-h-[90dvh] overflow-y-auto custom-scroll"
              >
                <div className="relative">
                  <button onClick={() => setSel(null)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow border border-ash hover:scale-110 transition">
                    <X size={18} className="text-ink-muted" />
                  </button>
                  <div className="aspect-[16/9] bg-gradient-to-br from-sun-pale to-gold-pale flex items-center justify-center relative overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute top-2 left-6 w-24 h-24 rounded-full bg-sun/40 animate-drift" />
                      <div className="absolute bottom-2 right-6 w-20 h-20 rounded-full bg-gold/35 animate-float" />
                    </div>
                    <Play size={48} className="text-tangerine/60 relative z-10" />
                  </div>
                </div>
                <div className="p-5 sm:p-7">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gradient mb-1">{sel.title}</h3>
                  <p className="text-xs text-ink-muted mb-3">By {sel.authorName} · {sel.resolution} · {sel.fileSize}</p>
                  <p className="text-sm text-ink-muted mb-4 leading-relaxed">{sel.description}</p>
                  <div className="flex gap-1.5 mb-5 flex-wrap">{sel.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}</div>
                  <div className="flex gap-2.5">
                    <button onClick={() => { download('scenepack', sel.id); setSel(null); }}
                      className="flex-1 py-3 rounded-xl btn-primary shadow-lg text-sm sm:text-base active:scale-95 transition">
                      Download Pack
                    </button>
                    <button onClick={() => setSel(null)} className="px-5 py-3 rounded-xl border-2 border-ash text-ink-muted font-semibold text-sm sm:text-base active:scale-95 transition">
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
