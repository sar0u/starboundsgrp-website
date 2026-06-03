import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MessageSquare, Hash, MoreHorizontal, Heart, Share2, Bookmark, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoungePage() {
  const { user, chatRooms, chatMessages, sendMessage, loadMessages } = useApp();
  const [activeRoom, setActiveRoom] = useState('room_general');
  const [msg, setMsg] = useState('');
  const [roomsOpen, setRoomsOpen] = useState(false);

  useEffect(() => { loadMessages(activeRoom); }, [activeRoom, loadMessages]);

  const onSend = async () => {
    if (!msg.trim()) return;
    await sendMessage(activeRoom, msg);
    setMsg('');
  };

  const pickRoom = (id: string) => { setActiveRoom(id); setRoomsOpen(false); };
  const room = chatRooms.find(r => r.id === activeRoom);
  // Online users — populated by Supabase Realtime in the future.
  // For now we show the signed-in user only (no fake placeholders).
  const online: { name: string; i: string }[] = user
    ? [{ name: user.name, i: user.avatar }]
    : [];

  return (
    <div
      className="w-full h-full overflow-hidden flex gap-3 sm:gap-4 px-3 sm:px-4 md:px-8"
      style={{ paddingTop: 'var(--page-pad-top)', paddingBottom: 'var(--page-pad-bottom)' }}
    >
      {/* Rooms — desktop */}
      <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-col w-56 glass rounded-2xl p-4 overflow-hidden shrink-0">
        <div className="flex items-center gap-2 mb-4 px-2"><Hash size={16} className="text-tangerine" /><span className="font-bold text-ink">Rooms</span></div>
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 -mx-1 px-1">
          {chatRooms.map(r => (
            <button key={r.id} onClick={() => pickRoom(r.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${activeRoom === r.id ? 'btn-primary text-white' : 'text-ink-muted hover:bg-sun-pale'}`}>
              <span className="font-mono">#</span>
              <span className="flex-1 text-left truncate">{r.name}</span>
              <span className={`text-[10px] ${activeRoom === r.id ? 'text-white/70' : 'text-ink-muted/60'}`}>{r.members}</span>
            </button>
          ))}
        </div>
      </motion.aside>

      {/* Rooms — mobile drawer */}
      <AnimatePresence>
        {roomsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRoomsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              className="lg:hidden fixed left-0 top-16 bottom-16 z-50 w-60 bg-white rounded-r-2xl shadow-2xl border-r border-y border-gold-pale p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2"><Hash size={16} className="text-tangerine" /><span className="font-bold text-ink">Rooms</span></div>
                <button onClick={() => setRoomsOpen(false)} className="p-1 rounded hover:bg-sun-pale"><X size={16} className="text-ink-muted" /></button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
                {chatRooms.map(r => (
                  <button key={r.id} onClick={() => pickRoom(r.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${activeRoom === r.id ? 'btn-primary text-white' : 'text-ink-muted hover:bg-sun-pale'}`}>
                    <span className="font-mono">#</span>
                    <span className="flex-1 text-left truncate">{r.name}</span>
                    <span className={`text-[10px] ${activeRoom === r.id ? 'text-white/70' : 'text-ink-muted/60'}`}>{r.members}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex-1 min-w-0 glass rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-3 sm:px-4 py-3 border-b border-ash-light flex items-center justify-between bg-gradient-to-r from-sun-pale/60 to-transparent shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => setRoomsOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-sun-pale transition shrink-0">
              <Menu size={18} className="text-tangerine" />
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl btn-primary flex items-center justify-center shrink-0">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-ink text-sm sm:text-base truncate">#{room?.name || 'general'}</h3>
              <p className="text-[11px] sm:text-xs text-ink-muted flex items-center gap-1"><Users size={11} />{room?.members || 0} members</p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-sun-pale transition shrink-0"><MoreHorizontal size={17} className="text-ink-muted" /></button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-4 space-y-3 sm:space-y-4">
          <AnimatePresence>
            {chatMessages.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .02 }} className="flex gap-2.5 sm:gap-3 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-sun to-tangerine flex items-center justify-center text-white text-[11px] sm:text-xs font-bold shadow shrink-0">{m.authorAvatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-sm text-ink">{m.authorName}</span>
                    <span className="text-[10px] sm:text-xs text-ink-muted">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed mb-1 break-words">{m.content}</p>
                  <div className="flex items-center gap-3 sm:gap-4 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <button className="flex items-center gap-1 text-[11px] sm:text-xs text-ink-muted hover:text-tangerine"><Heart size={11} />{m.likes}</button>
                    <button className="flex items-center gap-1 text-[11px] sm:text-xs text-ink-muted hover:text-tangerine"><MessageSquare size={11} />{m.replies}</button>
                    <button className="text-[11px] sm:text-xs text-ink-muted hover:text-tangerine"><Share2 size={11} /></button>
                    <button className="text-[11px] sm:text-xs text-ink-muted hover:text-tangerine"><Bookmark size={11} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {chatMessages.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 rounded-2xl bg-sun-pale border-2 border-dashed border-gold-pale flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={22} className="text-gold opacity-60" />
              </div>
              <p className="text-ink font-bold mb-1">It's quiet in here</p>
              <p className="text-sm text-ink-muted">{user ? 'Be the first to say something!' : 'Sign in to start the conversation.'}</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-3 sm:px-4 py-3 border-t border-ash-light shrink-0">
          <div className="flex gap-2">
            <input
              type="text" value={msg} onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSend()}
              placeholder={user ? 'Share your thoughts…' : 'Sign in to chat'}
              disabled={!user}
              className="flex-1 min-w-0 px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm disabled:opacity-50"
            />
            <button onClick={onSend} disabled={!user || !msg.trim()}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl btn-primary shadow shrink-0 disabled:opacity-50 active:scale-95 transition">
              <Send size={17} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Online — xl screens only */}
      <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="hidden xl:flex flex-col w-52 glass rounded-2xl p-4 overflow-hidden shrink-0">
        <div className="flex items-center gap-2 mb-4 px-1"><Users size={16} className="text-tangerine" /><span className="font-bold text-ink">Online</span><span className="ml-auto text-xs text-ink-muted">{online.length}</span></div>
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
          {online.length === 0 ? (
            <p className="text-xs text-ink-muted px-2 py-3">No one online right now.</p>
          ) : (
            online.map(u => (
              <div key={u.name} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sun-pale transition">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sun to-gold flex items-center justify-center text-white text-[11px] font-bold">{u.i}</div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <span className="text-sm text-ink-muted truncate">{u.name}</span>
              </div>
            ))
          )}
        </div>
      </motion.aside>
    </div>
  );
}
