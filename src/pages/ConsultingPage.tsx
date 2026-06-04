import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Send, Hand, Check, X, MessageCircle, Trash2, Clock, AlertCircle,
  Palette, Sparkles as MotionIcon, Music, Wand2, MonitorPlay, Workflow, HelpCircle, Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { HelpCategory, HelpUrgency, HelpRequest } from '../backend/models';

const CATEGORIES: { id: HelpCategory; label: string; icon: any; gradient: string }[] = [
  { id: 'Color Grading',   label: 'Color Grading',   icon: Palette,     gradient: 'from-rose-400 to-orange-400' },
  { id: 'Motion Graphics', label: 'Motion Graphics', icon: MotionIcon,  gradient: 'from-tangerine to-gold' },
  { id: 'Sound Design',    label: 'Sound Design',    icon: Music,       gradient: 'from-purple-400 to-pink-400' },
  { id: 'Transitions',     label: 'Transitions',     icon: Wand2,       gradient: 'from-gold to-sun' },
  { id: 'Software',        label: 'Software',        icon: MonitorPlay, gradient: 'from-blue-400 to-cyan-400' },
  { id: 'Workflow',        label: 'Workflow',        icon: Workflow,    gradient: 'from-emerald-400 to-teal-400' },
  { id: 'Other',           label: 'Other',           icon: HelpCircle,  gradient: 'from-slate-400 to-gray-400' },
];

const URGENCY_STYLES: Record<HelpUrgency, { label: string; class: string }> = {
  low:    { label: '🟢 Low',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: '🟡 Medium', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:   { label: '🔴 Urgent', class: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const STATUS_STYLES: Record<HelpRequest['status'], { label: string; class: string }> = {
  open:     { label: 'Open',     class: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  claimed:  { label: 'Helping',  class: 'bg-amber-100 text-amber-700 border-amber-300' },
  resolved: { label: 'Resolved', class: 'bg-slate-100 text-slate-600 border-slate-300' },
};

export default function ConsultingPage() {
  const { user, helpRequests, loadHelpRequests } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<HelpCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'claimed' | 'resolved'>('all');
  const [showForm, setShowForm] = useState(false);
  const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null);

  useEffect(() => { loadHelpRequests(); }, [loadHelpRequests]);

  const filtered = useMemo(() => helpRequests.filter(r =>
    (categoryFilter === 'all' || r.category === categoryFilter) &&
    (statusFilter === 'all' || r.status === statusFilter)
  ), [helpRequests, categoryFilter, statusFilter]);

  const openCount = helpRequests.filter(r => r.status === 'open').length;

  // Keep the open modal in sync with the latest request data after replies/claims
  useEffect(() => {
    if (!activeRequest) return;
    const updated = helpRequests.find(r => r.id === activeRequest.id);
    if (updated) setActiveRequest(updated);
  }, [helpRequests]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-shell">
      <div className="page-inner max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient mb-1.5">Ping an Editor</h2>
              <p className="text-ink-muted text-sm sm:text-base md:text-lg">
                Stuck on something? Ask the community. Got skills? Help someone out.
              </p>
            </div>
            {user && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }}
                onClick={() => setShowForm(true)}
                className="px-5 py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm font-bold shrink-0">
                <Plus size={16} /> Post a Request
              </motion.button>
            )}
          </div>
          {openCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <Zap size={12} /> {openCount} open request{openCount > 1 ? 's' : ''} waiting for help
            </div>
          )}
        </motion.div>

        {/* Category filters — pretty chip grid */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }} className="mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
            <button onClick={() => setCategoryFilter('all')}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${categoryFilter === 'all' ? 'btn-primary shadow-md' : 'bg-white border border-ash text-ink-muted hover:border-gold'}`}>
              All
            </button>
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const active = categoryFilter === c.id;
              return (
                <button key={c.id} onClick={() => setCategoryFilter(c.id)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${active ? 'btn-primary shadow-md' : 'bg-white border border-ash text-ink-muted hover:border-gold'}`}>
                  <Icon size={14} /> {c.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Status filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1 }}
          className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {(['all', 'open', 'claimed', 'resolved'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 capitalize ${statusFilter === s ? 'bg-gold-pale text-tangerine-dark border-2 border-sun' : 'bg-white border border-ash text-ink-muted hover:border-gold'}`}>
              {s === 'all' ? 'All status' : s}
            </button>
          ))}
        </motion.div>

        {/* List */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 rounded-2xl bg-sun-pale border-2 border-dashed border-gold-pale flex items-center justify-center mx-auto mb-4">
              <Hand size={26} className="text-gold opacity-60" />
            </div>
            <p className="text-ink font-bold mb-1">
              {helpRequests.length === 0 ? 'No requests yet' : 'No matching requests'}
            </p>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              {helpRequests.length === 0
                ? user ? 'Be the first to post! Click "Post a Request" to ask the community for help.'
                       : 'Sign in to post a request or help others.'
                : 'Try a different category or status filter.'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((r, i) => (
                <RequestCard
                  key={r.id}
                  req={r}
                  index={i}
                  isMine={user?.id === r.authorId}
                  onOpen={() => setActiveRequest(r)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Post Form Modal */}
      <AnimatePresence>
        {showForm && <PostFormModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Request Detail Modal */}
      <AnimatePresence>
        {activeRequest && (
          <RequestDetailModal req={activeRequest} onClose={() => setActiveRequest(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Request Card ────────────────────────────────────── */
function RequestCard({ req, index, isMine, onOpen }: { req: HelpRequest; index: number; isMine: boolean; onOpen: () => void }) {
  const cat = CATEGORIES.find(c => c.id === req.category) || CATEGORIES[CATEGORIES.length - 1];
  const Icon = cat.icon;
  const urg = URGENCY_STYLES[req.urgency];
  const stat = STATUS_STYLES[req.status];
  const replies = req.replies.length;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
      transition={{ delay: index * .03 }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className={`glass rounded-2xl p-4 sm:p-5 text-left flex flex-col gap-3 ${req.status === 'resolved' ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0 shadow`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${urg.class}`}>{urg.label}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stat.class}`}>{stat.label}</span>
            {isMine && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-pale text-tangerine-dark border border-sun">YOU</span>}
          </div>
          <h3 className="font-extrabold text-ink leading-snug line-clamp-2">{req.title}</h3>
        </div>
      </div>

      {req.description && (
        <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">{req.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-ash-light">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sun to-tangerine flex items-center justify-center text-white text-[10px] font-bold shrink-0">{req.authorAvatar}</div>
          <span className="text-xs text-ink-muted truncate font-semibold">{req.authorName}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-muted shrink-0">
          {replies > 0 && (
            <span className="flex items-center gap-1"><MessageCircle size={12} />{replies}</span>
          )}
          <span className="flex items-center gap-1"><Clock size={12} />{timeAgo(req.createdAt)}</span>
        </div>
      </div>

      {req.status === 'claimed' && req.claimedByName && (
        <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1.5 -mt-1">
          <Hand size={11} /> {req.claimedByName} is helping
        </div>
      )}
    </motion.button>
  );
}

/* ─── Post Request Form ───────────────────────────────── */
function PostFormModal({ onClose }: { onClose: () => void }) {
  const { createHelpRequest } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HelpCategory>('Color Grading');
  const [urgency, setUrgency] = useState<HelpUrgency>('medium');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const res = await createHelpRequest({ title, description, category, urgency });
    setBusy(false);
    if (res.ok) onClose();
  };

  const inp = "w-full px-4 py-2.5 rounded-xl bg-cream border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: .94, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .94, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] overflow-hidden shadow-2xl border-2 border-gold-pale flex flex-col"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-ash-light flex items-center justify-between bg-gradient-to-r from-sun-pale to-cream-warm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center shrink-0">
              <Hand size={18} className="text-white" />
            </div>
            <h3 className="font-extrabold text-ink text-lg">Post a Request</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-ash-light transition"><X size={18} className="text-ink-muted" /></button>
        </div>

        <form onSubmit={submit} className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto custom-scroll">
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} required autoFocus
              placeholder="e.g. Color grade looks washed out on my edit" className={inp} />
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                    className={`p-2.5 rounded-xl border-2 transition flex flex-col items-center gap-1 text-xs font-bold ${active ? 'border-gold bg-gold-pale text-tangerine-dark' : 'border-ash text-ink-muted hover:border-gold'}`}>
                    <Icon size={16} /> {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">Urgency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as HelpUrgency[]).map(u => (
                <button key={u} type="button" onClick={() => setUrgency(u)}
                  className={`p-2.5 rounded-xl border-2 transition text-xs font-bold ${urgency === u ? 'border-gold bg-gold-pale text-tangerine-dark' : 'border-ash text-ink-muted hover:border-gold'}`}>
                  {URGENCY_STYLES[u].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">Details (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={500}
              placeholder="Software, what you've tried, what you're aiming for…"
              className={inp + ' resize-none'} />
            <p className="text-[10px] text-ink-muted mt-1 text-right">{description.length}/500</p>
          </div>

          <button type="submit" disabled={busy || !title.trim()}
            className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50">
            <Send size={15} /> {busy ? 'Posting…' : 'Post Request'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Detail Modal (Claim, Reply, Resolve) ────────────── */
function RequestDetailModal({ req, onClose }: { req: HelpRequest; onClose: () => void }) {
  const { user, isAdmin, claimHelpRequest, unclaimHelpRequest, resolveHelpRequest, replyToHelpRequest, deleteHelpRequest } = useApp();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState<'claim' | 'unclaim' | 'resolve' | 'reply' | 'delete' | null>(null);

  const cat = CATEGORIES.find(c => c.id === req.category) || CATEGORIES[CATEGORIES.length - 1];
  const Icon = cat.icon;
  const urg = URGENCY_STYLES[req.urgency];
  const stat = STATUS_STYLES[req.status];
  const isMine = user?.id === req.authorId;
  const isClaimer = user?.id === req.claimedBy;
  const canClaim = user && !isMine && req.status === 'open';
  const canUnclaim = isClaimer && req.status === 'claimed';
  const canResolve = isMine && req.status !== 'resolved';
  const canDelete = isMine || isAdmin;

  const onReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy('reply');
    const res = await replyToHelpRequest(req.id, reply);
    setBusy(null);
    if (res.ok) setReply('');
  };

  const onAction = async (action: 'claim' | 'unclaim' | 'resolve' | 'delete') => {
    setBusy(action);
    if (action === 'claim') await claimHelpRequest(req.id);
    else if (action === 'unclaim') await unclaimHelpRequest(req.id);
    else if (action === 'resolve') await resolveHelpRequest(req.id);
    else if (action === 'delete') { await deleteHelpRequest(req.id); onClose(); return; }
    setBusy(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: .94, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .94, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92dvh] overflow-hidden shadow-2xl border-2 border-gold-pale flex flex-col"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-ash-light flex items-start gap-3 bg-gradient-to-r from-sun-pale to-cream-warm">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0 shadow`}>
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${urg.class}`}>{urg.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stat.class}`}>{stat.label}</span>
              <span className="text-[10px] text-ink-muted font-semibold">{cat.label}</span>
            </div>
            <h3 className="font-extrabold text-ink text-lg leading-snug break-words">{req.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-ash-light transition shrink-0"><X size={18} className="text-ink-muted" /></button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto custom-scroll px-5 sm:px-6 py-5 space-y-4">
          {/* Author meta */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sun to-tangerine flex items-center justify-center text-white text-xs font-bold shrink-0">{req.authorAvatar}</div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-ink truncate">{req.authorName} {isMine && <span className="text-tangerine">(you)</span>}</div>
              <div className="text-xs text-ink-muted">{timeAgo(req.createdAt)}</div>
            </div>
          </div>

          {req.description ? (
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">{req.description}</p>
          ) : (
            <p className="text-sm text-ink-muted italic">No additional details provided.</p>
          )}

          {req.claimedByName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <Hand size={14} /> <span className="font-bold">{req.claimedByName}</span> is helping with this request
            </div>
          )}

          {/* Replies */}
          {req.replies.length > 0 && (
            <div className="pt-3 border-t border-ash-light">
              <h4 className="text-xs font-extrabold text-ink-muted uppercase tracking-wide mb-3">
                {req.replies.length} {req.replies.length === 1 ? 'Reply' : 'Replies'}
              </h4>
              <div className="space-y-3">
                {req.replies.map(r => (
                  <div key={r.id} className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sun to-gold flex items-center justify-center text-white text-[10px] font-bold shrink-0">{r.authorAvatar}</div>
                    <div className="flex-1 min-w-0 bg-cream rounded-xl px-3 py-2 border border-ash-light">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-xs text-ink">{r.authorName}</span>
                        <span className="text-[10px] text-ink-muted">{timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap break-words">{r.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-ash-light bg-cream-warm space-y-2">
          {/* Quick actions */}
          {user && req.status !== 'resolved' && (
            <div className="flex flex-wrap gap-2">
              {canClaim && (
                <button onClick={() => onAction('claim')} disabled={busy === 'claim'}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-sm font-bold shadow disabled:opacity-60">
                  <Hand size={14} /> {busy === 'claim' ? 'Claiming…' : "I'll Help"}
                </button>
              )}
              {canUnclaim && (
                <button onClick={() => onAction('unclaim')} disabled={busy === 'unclaim'}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-secondary text-sm font-bold disabled:opacity-60">
                  <AlertCircle size={14} /> {busy === 'unclaim' ? 'Releasing…' : 'Release'}
                </button>
              )}
              {canResolve && (
                <button onClick={() => onAction('resolve')} disabled={busy === 'resolve'}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow disabled:opacity-60 transition">
                  <Check size={14} /> {busy === 'resolve' ? 'Saving…' : 'Mark Resolved'}
                </button>
              )}
              {canDelete && (
                <button onClick={() => onAction('delete')} disabled={busy === 'delete'}
                  className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-sm font-bold disabled:opacity-60 transition" title="Delete">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}

          {/* Reply input */}
          {user ? (
            req.status !== 'resolved' && (
              <form onSubmit={onReply} className="flex gap-2">
                <input type="text" value={reply} onChange={e => setReply(e.target.value)}
                  placeholder="Add a reply…" maxLength={500}
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm" />
                <button type="submit" disabled={busy === 'reply' || !reply.trim()}
                  className="px-4 py-2.5 rounded-xl btn-primary shadow shrink-0 disabled:opacity-50">
                  <Send size={15} />
                </button>
              </form>
            )
          ) : (
            <p className="text-xs text-ink-muted text-center">Sign in to claim or reply.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
