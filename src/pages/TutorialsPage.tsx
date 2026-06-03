import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, ArrowRight, BookOpen, Eye, Play, Heart, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TutorialsPage() {
  const { tutorials, download, likedItems, toggleLike, isAdmin, deleteTutorial } = useApp();
  const [cat, setCat] = useState('All');
  const [lvl, setLvl] = useState('All');
  const [q, setQ] = useState('');

  const cats = ['All', ...Array.from(new Set(tutorials.map(t => t.category)))];
  const list = tutorials.filter(t =>
    (cat === 'All' || t.category === cat) &&
    (lvl === 'All' || t.level === lvl) &&
    (t.title.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="page-shell">
      <div className="page-inner max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient mb-1.5">Fancy Quick-Guides</h2>
          <p className="text-ink-muted text-sm sm:text-base md:text-lg max-w-2xl">
            Master the art of visual storytelling with our curated editing tutorials.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }} className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
            <input
              type="text" placeholder="Search tutorials…" value={q} onChange={e => setQ(e.target.value)}
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

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map(l => (
            <button key={l} onClick={() => setLvl(l)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${lvl === l ? 'bg-gold-pale text-tangerine-dark border-2 border-sun' : 'bg-white border border-ash text-ink-muted hover:border-gold'}`}>
              {l === 'All' ? 'All Levels' : l}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-4 sm:space-y-5">
          <AnimatePresence mode="popLayout">
            {list.map((t, i) => {
              const liked = likedItems.has(`tutorial_${t.id}`);
              return (
                <motion.div
                  key={t.id} layout
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ delay: i * .03, type: 'spring', stiffness: 300, damping: 28 }}
                  className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-48 md:w-52 aspect-[16/10] sm:aspect-auto sm:h-32 rounded-xl bg-gradient-to-br from-sun-pale via-gold-pale to-cream-warm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute top-2 left-3 w-14 h-14 rounded-full bg-sun/40 animate-drift" />
                      <div className="absolute bottom-2 right-3 w-10 h-10 rounded-full bg-gold/30 animate-float" />
                    </div>
                    <Play size={32} className="text-tangerine/60 relative z-10 drop-shadow" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[11px] font-bold text-ink">{t.duration}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="tag">{t.category}</span>
                      <span className="flex items-center gap-1 text-xs text-ink-muted"><Clock size={12} />{t.duration}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${t.level === 'Beginner' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : t.level === 'Intermediate' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{t.level}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-ink mb-1.5">{t.title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed mb-3 line-clamp-3 sm:line-clamp-none">{t.description}</p>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-ink-muted flex-wrap">
                      <span className="flex items-center gap-1"><Eye size={12} />{t.views.toLocaleString()} views</span>
                      <span className="flex items-center gap-1"><Heart size={12} className={liked ? 'text-red-500 fill-red-500' : ''} />{t.likes} likes</span>
                      <span className="truncate">By {t.author}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full btn-primary flex items-center justify-center text-white text-xs font-bold shadow">{t.authorInitials}</div>
                      <button onClick={() => toggleLike(`tutorial_${t.id}`)}
                        className={`p-2 rounded-lg transition active:scale-95 ${liked ? 'bg-red-50 text-red-500' : 'bg-sun-pale/50 text-ink-muted hover:text-red-500'}`}>
                        <Heart size={14} className={liked ? 'fill-current' : ''} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => deleteTutorial(t.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition active:scale-95"><Trash2 size={14} /></button>
                      )}
                    </div>
                    <button onClick={() => download('tutorial', t.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-xs sm:text-sm shadow-lg shadow-gold/20 active:scale-95 transition">
                      Get Guide <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {list.length === 0 && (
          <div className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 rounded-2xl bg-sun-pale border-2 border-dashed border-gold-pale flex items-center justify-center mx-auto mb-4">
              <BookOpen size={26} className="text-gold opacity-60" />
            </div>
            <p className="text-ink font-bold mb-1">
              {tutorials.length === 0 ? 'No tutorials yet' : 'No matching tutorials'}
            </p>
            <p className="text-sm text-ink-muted max-w-xs mx-auto">
              {tutorials.length === 0
                ? 'Step-by-step guides from our experts will appear here soon.'
                : 'Try a different search, category or level.'}
            </p>
          </div>
        )}

        {tutorials.length > 6 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35 }} className="flex justify-center mt-8">
            <button className="flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl btn-secondary text-sm sm:text-base active:scale-95 transition">
              <BookOpen size={18} /> Explore More Tutorials <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
