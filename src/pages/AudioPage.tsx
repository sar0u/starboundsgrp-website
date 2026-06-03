import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Pause, Clock, Download, Heart, Volume2, Music, Headphones } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AudioPage() {
  const { audioTracks, download, likedItems, toggleLike } = useApp();
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);

  const cats = ['All', ...Array.from(new Set(audioTracks.map(t => t.category)))];
  const list = audioTracks.filter(t =>
    (cat === 'All' || t.category === cat) &&
    (t.title.toLowerCase().includes(q.toLowerCase()) || t.artist.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="page-shell">
      <div className="page-inner max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient mb-1.5">Audio Library</h2>
          <p className="text-ink-muted text-sm sm:text-base md:text-lg">Royalty-free music and sound effects for your projects</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
            <input
              type="text" placeholder="Search tracks…" value={q} onChange={e => setQ(e.target.value)}
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

        {/* Featured — only when there's content worth featuring */}
        {audioTracks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
            className="mb-6 p-5 sm:p-6 rounded-2xl btn-primary relative overflow-hidden shadow-xl shadow-gold/25">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/20 animate-drift" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 animate-float" />
            </div>
            <div className="relative z-10 flex items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/25 flex items-center justify-center backdrop-blur-sm shrink-0">
                <Music size={28} className="sm:hidden text-white" />
                <Music size={36} className="hidden sm:block text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-2xl font-extrabold mb-0.5 text-white">Featured Collection</h3>
                <p className="text-white/90 text-sm sm:text-base">Hand-picked tracks for cinematic edits</p>
                <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-white/80 flex-wrap">
                  <span className="flex items-center gap-1"><Headphones size={14} />{audioTracks.length} tracks</span>
                  <span className="flex items-center gap-1"><Volume2 size={14} />Royalty-Free</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* List */}
        <div className="space-y-2.5 sm:space-y-3">
          <AnimatePresence mode="popLayout">
            {list.map((t, i) => {
              const liked = likedItems.has(`audio_${t.id}`);
              const isPlay = playing === t.id;
              return (
                <motion.div
                  key={t.id} layout
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * .03, type: 'spring', stiffness: 300, damping: 28 }}
                  className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                >
                  <button
                    onClick={() => setPlaying(isPlay ? null : t.id)}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md active:scale-95 transition ${isPlay ? 'bg-tangerine animate-glow-ring' : 'btn-primary'}`}
                  >
                    {isPlay ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-ink truncate text-sm sm:text-base">{t.title}</h4>
                    <p className="text-xs sm:text-sm text-ink-muted truncate">{t.artist}</p>
                  </div>

                  <div className="hidden md:flex items-center gap-4 lg:gap-5 text-sm text-ink-muted shrink-0">
                    <span className="tag">{t.category}</span>
                    <span className="flex items-center gap-1"><Volume2 size={14} />{t.bpm} BPM</span>
                    <span className="flex items-center gap-1"><Clock size={14} />{t.duration}</span>
                  </div>

                  <div className="md:hidden flex items-center text-xs text-ink-muted shrink-0">{t.duration}</div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleLike(`audio_${t.id}`)}
                      className={`p-2 rounded-lg transition active:scale-95 ${liked ? 'bg-red-50 text-red-500' : 'text-ink-muted hover:bg-sun-pale'}`}>
                      <Heart size={16} className={liked ? 'fill-current' : ''} />
                    </button>
                    <button onClick={() => download('audio', t.id)} className="p-2 rounded-lg text-ink-muted hover:bg-sun-pale transition active:scale-95">
                      <Download size={16} />
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
              <Music size={26} className="text-gold opacity-60" />
            </div>
            <p className="text-ink font-bold mb-1">
              {audioTracks.length === 0 ? 'No audio tracks yet' : 'No matching tracks'}
            </p>
            <p className="text-sm text-ink-muted max-w-xs mx-auto">
              {audioTracks.length === 0
                ? 'Curated royalty-free music & sound effects will appear here soon.'
                : 'Try a different search or category.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
