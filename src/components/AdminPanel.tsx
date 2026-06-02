import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Package, Music, BookOpen, Sparkles, Users as UsersIcon, Shield, ShieldOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { User } from '../backend/models';
import FileUpload from './FileUpload';

interface Props { isOpen: boolean; onClose: () => void; }

type Tab = 'scenepack' | 'tutorial' | 'audio' | 'users';

export default function AdminPanel({ isOpen, onClose }: Props) {
  const { addScenepack, addTutorial, addAudioTrack, isAdmin, user } = useApp();
  const [tab, setTab] = useState<Tab>('scenepack');
  if (!isAdmin) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ scale: .94, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .94, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[92dvh] overflow-hidden shadow-2xl border-2 border-gold-pale animate-glow-ring flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-ash-light flex items-center justify-between bg-gradient-to-r from-sun-pale to-cream-warm shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl btn-primary flex items-center justify-center shrink-0"><Sparkles size={20} className="text-white" /></div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold text-ink">Admin Panel</h2>
                  <p className="text-xs text-ink-muted truncate">Publishing as <span className="text-tangerine font-bold">{user?.name}</span></p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-ash-light transition shrink-0"><X size={18} className="text-ink-muted" /></button>
            </div>
            {/* Tabs */}
            <div className="px-3 sm:px-6 pt-3 sm:pt-4 shrink-0">
              <div className="flex gap-1 bg-sun-pale/60 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
                {([
                  ['scenepack', 'Scenepack', Package],
                  ['tutorial', 'Tutorial', BookOpen],
                  ['audio', 'Audio', Music],
                  ['users', 'Users', UsersIcon],
                ] as const).map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${tab === id ? 'btn-primary text-white shadow-md' : 'text-ink-muted hover:text-tangerine'}`}>
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>
            </div>
            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto custom-scroll flex-1 min-h-0">
              {tab === 'scenepack' && <ScenepackForm onSubmit={async (d) => { await addScenepack(d); onClose(); }} />}
              {tab === 'tutorial' && <TutorialForm onSubmit={async (d) => { await addTutorial(d); onClose(); }} />}
              {tab === 'audio' && <AudioForm onSubmit={async (d) => { await addAudioTrack(d); onClose(); }} />}
              {tab === 'users' && <UsersManager />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Forms ─────────────────────────────────────────────── */
const inp = "w-full px-4 py-2.5 rounded-xl bg-cream border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm";
const lbl = "block text-sm font-bold text-ink mb-1.5";

function ScenepackForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [f, s] = useState({ title: '', category: 'Urban', duration: '10 min', clips: 20, tags: '', isPremium: false, resolution: '4K', description: '' });
  const [file, setFile] = useState<{ url?: string; name?: string; size?: string }>({});
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return; onSubmit({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean), fileUrl: file.url, fileName: file.name, fileSize: file.size || '—' }); }} className="space-y-4">
      <div><label className={lbl}>Title *</label><input className={inp} value={f.title} onChange={(e) => s({ ...f, title: e.target.value })} placeholder="e.g. Cinematic Urban Vibes" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Category</label><select className={inp} value={f.category} onChange={(e) => s({ ...f, category: e.target.value })}>{['Urban','Nature','Sports','Abstract','Sci-Fi','Events'].map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className={lbl}>Duration</label><input className={inp} value={f.duration} onChange={(e) => s({ ...f, duration: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Clips</label><input type="number" className={inp} value={f.clips} onChange={(e) => s({ ...f, clips: +e.target.value })} /></div>
        <div><label className={lbl}>Resolution</label><select className={inp} value={f.resolution} onChange={(e) => s({ ...f, resolution: e.target.value })}>{['1080p','4K','8K'].map(r => <option key={r}>{r}</option>)}</select></div>
      </div>
      <div><label className={lbl}>Tags (comma-separated)</label><input className={inp} value={f.tags} onChange={(e) => s({ ...f, tags: e.target.value })} placeholder="4K, Drone, Night" /></div>
      <div><label className={lbl}>Description</label><textarea className={inp + ' resize-none'} rows={3} value={f.description} onChange={(e) => s({ ...f, description: e.target.value })} /></div>
      <FileUpload bucket="scenepacks" value={file} onChange={setFile} accept=".zip,.rar,.7z,.mp4,.mov" />
      <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={f.isPremium} onChange={(e) => s({ ...f, isPremium: e.target.checked })} className="w-5 h-5 accent-gold" /><span className="text-sm font-semibold text-ink">Premium</span></label>
      <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }} className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm"><Plus size={16} /> Publish Scenepack</motion.button>
    </form>
  );
}

function TutorialForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [f, s] = useState({ title: '', category: 'Visuals', duration: '10 Mins', level: 'Intermediate', description: '', content: '' });
  const [file, setFile] = useState<{ url?: string; name?: string; size?: string }>({});
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return; onSubmit({ ...f, fileUrl: file.url, fileName: file.name }); }} className="space-y-4">
      <div><label className={lbl}>Title *</label><input className={inp} value={f.title} onChange={(e) => s({ ...f, title: e.target.value })} required /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Category</label><select className={inp} value={f.category} onChange={(e) => s({ ...f, category: e.target.value })}>{['Visuals','Rhythm','Structure','Audio'].map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className={lbl}>Duration</label><input className={inp} value={f.duration} onChange={(e) => s({ ...f, duration: e.target.value })} /></div>
        <div><label className={lbl}>Level</label><select className={inp} value={f.level} onChange={(e) => s({ ...f, level: e.target.value })}>{['Beginner','Intermediate','Advanced'].map(l => <option key={l}>{l}</option>)}</select></div>
      </div>
      <div><label className={lbl}>Description</label><textarea className={inp + ' resize-none'} rows={3} value={f.description} onChange={(e) => s({ ...f, description: e.target.value })} /></div>
      <FileUpload bucket="tutorials" value={file} onChange={setFile} accept=".pdf,.zip,.mp4,.mov" />
      <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }} className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm"><Plus size={16} /> Publish Tutorial</motion.button>
    </form>
  );
}

function AudioForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [f, s] = useState({ title: '', artist: '', duration: '3:00', category: 'Electronic', bpm: 120, description: '' });
  const [file, setFile] = useState<{ url?: string; name?: string; size?: string }>({});
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return; onSubmit({ ...f, fileUrl: file.url, fileName: file.name, fileSize: file.size || '—' }); }} className="space-y-4">
      <div><label className={lbl}>Title *</label><input className={inp} value={f.title} onChange={(e) => s({ ...f, title: e.target.value })} required /></div>
      <div><label className={lbl}>Artist</label><input className={inp} value={f.artist} onChange={(e) => s({ ...f, artist: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Duration</label><input className={inp} value={f.duration} onChange={(e) => s({ ...f, duration: e.target.value })} /></div>
        <div><label className={lbl}>Category</label><select className={inp} value={f.category} onChange={(e) => s({ ...f, category: e.target.value })}>{['Electronic','Orchestral','Lo-Fi','Hip-Hop','Ambient','Synthwave'].map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className={lbl}>BPM</label><input type="number" className={inp} value={f.bpm} onChange={(e) => s({ ...f, bpm: +e.target.value })} /></div>
      </div>
      <div><label className={lbl}>Description</label><textarea className={inp + ' resize-none'} rows={2} value={f.description} onChange={(e) => s({ ...f, description: e.target.value })} /></div>
      <FileUpload bucket="audio" value={file} onChange={setFile} accept=".mp3,.wav,.flac,.aac,.ogg,.m4a" />
      <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }} className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm"><Plus size={16} /> Publish Audio</motion.button>
    </form>
  );
}

/* ─── Users Manager — promote / demote members ─────────── */
function UsersManager() {
  const { listUsers, setUserRole, user: me } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const list = await listUsers();
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = async (target: User) => {
    setBusy(target.id);
    const newRole = target.role === 'admin' ? 'user' : 'admin';
    await setUserRole(target.id, newRole);
    await refresh();
    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-extrabold text-ink mb-1">Manage Members</h3>
        <p className="text-sm text-ink-muted">Promote community members to admin or demote existing admins.</p>
      </div>

      <input
        type="text" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        className={inp}
      />

      {loading ? (
        <div className="text-center text-ink-muted py-8">Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-ink-muted py-8">No users match.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const isMe = u.id === me?.id;
            const isAdminUser = u.role === 'admin';
            return (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-cream-warm border border-ash hover:border-gold transition-colors">
                <div className="w-10 h-10 rounded-lg btn-primary flex items-center justify-center text-white font-bold text-xs shrink-0">{u.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-ink text-sm truncate">{u.name}</span>
                    {isAdminUser && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-pale border border-sun text-[10px] font-bold text-tangerine-dark">
                        <Shield size={9} /> ADMIN
                      </span>
                    )}
                    {isMe && <span className="text-[10px] font-bold text-ink-muted">(you)</span>}
                  </div>
                  <div className="text-xs text-ink-muted truncate">{u.email}</div>
                </div>
                <button
                  onClick={() => toggle(u)}
                  disabled={isMe || busy === u.id}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isAdminUser
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                      : 'btn-primary text-white shadow'
                  }`}
                  title={isMe ? "You can't change your own role" : isAdminUser ? 'Demote to member' : 'Promote to admin'}
                >
                  {isAdminUser ? <><ShieldOff size={13} /> Demote</> : <><Shield size={13} /> Make Admin</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
