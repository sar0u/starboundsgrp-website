import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Mail, Phone, FileText, Lock, Save, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props { isOpen: boolean; onClose: () => void; }

type Tab = 'profile' | 'email' | 'password';

const inp = "w-full pl-11 pr-4 py-3 rounded-xl bg-cream border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm";
const lbl = "block text-sm font-bold text-ink mb-1.5";

export default function ProfileModal({ isOpen, onClose }: Props) {
  const { user, updateProfile, updateEmail, updatePassword, requestPasswordReset } = useApp();
  const [tab, setTab] = useState<Tab>('profile');

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: .94, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .94, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] overflow-hidden shadow-2xl border-2 border-gold-pale flex flex-col"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-ash-light flex items-center justify-between bg-gradient-to-r from-sun-pale to-cream-warm shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl btn-primary flex items-center justify-center text-white font-bold text-sm shrink-0">{user.avatar}</div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold text-ink">Your Profile</h2>
                  <p className="text-xs text-ink-muted truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-ash-light transition shrink-0">
                <X size={18} className="text-ink-muted" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-3 sm:px-6 pt-3 sm:pt-4 shrink-0">
              <div className="flex gap-1 bg-sun-pale/60 p-1 rounded-2xl">
                {([['profile', 'Profile', UserIcon], ['email', 'Email', Mail], ['password', 'Password', Lock]] as const).map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${tab === id ? 'btn-primary text-white shadow-md' : 'text-ink-muted hover:text-tangerine'}`}>
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto custom-scroll flex-1 min-h-0">
              {tab === 'profile' && <ProfileForm onSave={updateProfile} initial={{ name: user.name, bio: user.bio || '', phone: '' }} />}
              {tab === 'email' && <EmailForm currentEmail={user.email} onUpdate={updateEmail} />}
              {tab === 'password' && <PasswordForm onUpdate={updatePassword} onReset={() => requestPasswordReset(user.email)} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Profile sub-forms ──────────────────────────────────── */

function ProfileForm({ initial, onSave }: {
  initial: { name: string; bio: string; phone: string };
  onSave: (u: { name?: string; bio?: string; phone?: string; avatar?: string }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio);
  const [phone, setPhone] = useState(initial.phone);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const res = await onSave({ name, bio, phone });
    setBusy(false);
    // The context already shows a toast on both success and failure — no
    // need to duplicate it here. We only surface an inline hint on failure
    // so the form keeps the focus context.
    if (!res.ok) setErr('Could not save. Please try again.');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={lbl}>Display Name</label>
        <div className="relative">
          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inp} placeholder="Your name" />
        </div>
      </div>
      <div>
        <label className={lbl}>Phone (optional)</label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="+1 555 123 4567" />
        </div>
      </div>
      <div>
        <label className={lbl}>Bio (optional)</label>
        <div className="relative">
          <FileText className="absolute left-3.5 top-3.5 text-ink-muted" size={15} />
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            className={inp + ' resize-none pt-3'} placeholder="Tell the community a bit about yourself…" />
        </div>
      </div>
      {err && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600">
          <AlertCircle size={13} />{err}
        </div>
      )}
      <button type="submit" disabled={busy}
        className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-60">
        <Save size={15} /> {busy ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}

function EmailForm({ currentEmail, onUpdate }: {
  currentEmail: string;
  onUpdate: (newEmail: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true); setDone(false);
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setBusy(false); setErr('That is already your email.'); return;
    }
    const res = await onUpdate(newEmail);
    setBusy(false);
    if (res.ok) { setDone(true); setNewEmail(''); }
    else setErr(res.error || 'Email update failed.');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={lbl}>Current Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
          <input type="email" value={currentEmail} disabled className={inp + ' opacity-70 cursor-not-allowed'} />
        </div>
      </div>
      <div>
        <label className={lbl}>New Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inp} placeholder="new@example.com" required />
        </div>
      </div>
      <p className="text-xs text-ink-muted">
        We'll send a confirmation link to the new address. Your email won't change until you click it.
      </p>
      {err && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600">
          <AlertCircle size={13} />{err}
        </div>
      )}
      {done && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 size={13} /> Confirmation link sent.
        </div>
      )}
      <button type="submit" disabled={busy}
        className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-60">
        <Save size={15} /> {busy ? 'Sending…' : 'Update Email'}
      </button>
    </form>
  );
}

function PasswordForm({ onUpdate, onReset }: {
  onUpdate: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  onReset: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setDone(false);
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { setErr("Passwords don't match."); return; }
    setBusy(true);
    const res = await onUpdate(pw);
    setBusy(false);
    if (res.ok) { setDone(true); setPw(''); setPw2(''); }
    else setErr(res.error || 'Update failed.');
  };

  const sendReset = async () => {
    setBusy(true); setErr('');
    await onReset();
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={lbl}>New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} className={inp} placeholder="At least 6 characters" required minLength={6} />
          </div>
        </div>
        <div>
          <label className={lbl}>Confirm New Password</label>
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
        {done && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 size={13} /> Password updated successfully.
          </div>
        )}
        <button type="submit" disabled={busy}
          className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-60">
          <Save size={15} /> {busy ? 'Saving…' : 'Update Password'}
        </button>
      </form>

      <div className="pt-4 border-t border-ash">
        <p className="text-xs text-ink-muted mb-2">Forgot your current password?</p>
        <button onClick={sendReset} disabled={busy}
          className="w-full py-2.5 rounded-xl btn-secondary text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          <KeyRound size={14} /> Send Reset Email
        </button>
      </div>
    </div>
  );
}
