import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const inp = "w-full pl-11 pr-4 py-3 rounded-xl bg-cream border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm";

export default function RecoveryModal() {
  const { recoveryMode, updatePassword, clearRecoveryMode } = useApp();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== pw2)    { setErr("Passwords don't match."); return; }
    setBusy(true);
    const res = await updatePassword(pw);
    setBusy(false);
    if (res.ok) { setDone(true); setTimeout(() => { setDone(false); setPw(''); setPw2(''); clearRecoveryMode(); }, 1600); }
    else setErr(res.error || 'Could not update password.');
  };

  return (
    <AnimatePresence>
      {recoveryMode && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: .94, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .94, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl border-2 border-gold-pale overflow-hidden"
          >
            <div className="px-5 sm:px-7 py-5 sm:py-7">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl btn-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gold/30">
                  <KeyRound size={24} className="text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gradient mb-1">Reset Your Password</h2>
                <p className="text-sm text-ink-muted">Choose a new password to finish recovery.</p>
              </div>

              {done ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700">
                  <CheckCircle2 size={20} />
                  <div className="text-sm font-bold">Password updated! Redirecting…</div>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3.5">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                      <input type="password" value={pw} onChange={e => setPw(e.target.value)} className={inp} placeholder="At least 6 characters" required minLength={6} autoFocus />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                      <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} className={inp} placeholder="Repeat password" required minLength={6} />
                    </div>
                  </div>
                  {err && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600">
                      <AlertCircle size={13} />{err}
                    </div>
                  )}
                  <button type="submit" disabled={busy}
                    className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 font-bold text-sm disabled:opacity-60">
                    {busy ? 'Saving…' : 'Set New Password'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
