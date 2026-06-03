import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, User, AlertCircle } from 'lucide-react';
import { useApp, isSupabaseEnabled } from '../context/AppContext';
import * as api from '../backend/api';

export default function LoginPage({ onBack }: { onBack: () => void }) {
  const { login, loginWithDiscord, register, requestPasswordReset } = useApp();
  const [isReg, setIsReg] = useState(false);
  const [show, setShow] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Pre-warm Supabase the moment the user lands on the login page.
  // The free tier auto-pauses after inactivity; this wakes it up
  // BEFORE the user clicks "Sign In", so the first click feels instant.
  useEffect(() => {
    const url = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
    if (!url) return;
    fetch(`${url}/auth/v1/health`, { cache: 'no-store', keepalive: true }).catch(() => { /* silent */ });
  }, []);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'form' | 'verify' | 'ok' | 'forgot' | 'forgot-sent'>('form');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  // Track how long a request has been pending, so we can show a hint
  // after a few seconds that the backend is waking up.
  useEffect(() => {
    if (!busy) { setElapsed(0); return; }
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(t);
  }, [busy]);

  const sendReset = async () => {
    setErr('');
    if (!email.trim()) { setErr('Enter your email first.'); return; }
    setBusy(true);
    const res = await requestPasswordReset(email);
    setBusy(false);
    if (res.ok) setStep('forgot-sent');
    else setErr(res.error || 'Could not send reset email.');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    if (isReg) {
      // All new sign-ups are community members by default.
      // Admins are promoted afterwards from the Admin Panel.
      const res = await register(name, email, pw, 'user');
      setBusy(false);
      if (res.ok) {
        if (res.needsVerification || !isSupabaseEnabled) setStep('verify');
        else { setStep('ok'); setTimeout(onBack, 1200); }
      } else setErr(res.error || 'Registration failed.');
    } else {
      const res = await login(email, pw);
      setBusy(false);
      if (res.ok) { setStep('ok'); setTimeout(onBack, 1200); }
      else setErr(res.error || 'Sign-in failed.');
    }
  };

  const verify = async () => {
    setBusy(true);
    const res = await api.apiVerifyEmail(email, code);
    setBusy(false);
    if (res.ok) { setStep('ok'); setTimeout(onBack, 1200); }
    else setErr('Invalid code (try 1234)');
  };

  const resend = async () => {
    setErr(''); setBusy(true);
    const res = await api.apiResendVerification(email);
    setBusy(false);
    if (!res.ok) setErr(res.error || 'Failed to resend.');
  };

  const onDiscord = async () => {
    setErr(''); setBusy(true);
    const res = await loginWithDiscord();
    if (res.redirected) return;
    setBusy(false);
    if (res.ok) { setStep('ok'); setTimeout(onBack, 1200); }
    else setErr(res.error || 'Discord sign-in failed.');
  };

  const inp = "w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm";

  return (
    <div className="page-shell flex items-start sm:items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md my-auto">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="f"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl shadow-gold/10 border-2 border-gold-pale"
            >
              <button onClick={onBack} className="flex items-center gap-2 text-ink-muted hover:text-tangerine transition mb-5 text-sm">
                <ArrowLeft size={16} /> Back
              </button>

              <div className="text-center mb-5">
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: .1 }}
                  className="w-14 h-14 rounded-2xl btn-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gold/30">
                  <LogIn size={24} className="text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gradient mb-1">{isReg ? 'Join starboundsgrp' : 'Welcome Back'}</h2>
                <p className="text-sm text-ink-muted">{isReg ? 'Start your creative journey' : 'Sign in to continue'}</p>
              </div>

              {/* Discord */}
              <button onClick={onDiscord} disabled={busy}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#5865F2] text-white font-semibold mb-4 hover:bg-[#4752C4] transition shadow-md text-sm disabled:opacity-60 active:scale-95">
                <svg width="20" height="20" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                </svg>
                Continue with Discord
              </button>

              <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-ash" /><span className="text-[11px] text-ink-muted">or with email</span><div className="flex-1 h-px bg-ash" /></div>

              <AnimatePresence>
                {err && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-sm text-rose-600">
                    <AlertCircle size={15} className="shrink-0" />
                    <span className="min-w-0 break-words">{err}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={submit} className="space-y-3">
                {isReg && (
                  <div>
                    <label className="block text-sm font-bold text-ink mb-1.5">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your editor name" className={inp} required autoComplete="name" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-ink mb-1.5">Email</label>
                  <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inp} required autoComplete="email" /></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-1.5">Password</label>
                  <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                    <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" className={inp + ' pr-12'} required autoComplete={isReg ? 'new-password' : 'current-password'} />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-tangerine p-1">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={busy}
                  className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 disabled:opacity-60 font-bold text-sm active:scale-95 transition">
                  {busy ? (elapsed > 4 ? `Waking up server… ${elapsed}s` : 'Processing…') : isReg ? 'Create Account' : 'Sign In'}
                </button>
                {busy && elapsed > 6 && (
                  <p className="text-[11px] text-ink-muted text-center mt-2 leading-relaxed">
                    First sign-in after a while can take up to 30 seconds while the backend wakes up.
                  </p>
                )}
              </form>

              {!isReg && (
                <div className="text-center mt-3">
                  <button type="button" onClick={() => setStep('forgot')} className="text-xs text-ink-muted hover:text-tangerine font-semibold">
                    Forgot your password?
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-ink-muted mt-3">
                {isReg ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsReg(!isReg); setErr(''); }} className="text-tangerine font-bold hover:text-tangerine-dark">
                  {isReg ? 'Sign In' : 'Create one'}
                </button>
              </p>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div key="v"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl shadow-gold/10 border-2 border-gold-pale text-center"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-14 h-14 rounded-2xl btn-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gold/30">
                <Mail size={24} className="text-white" />
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gradient mb-2">Check Your Inbox</h2>

              {isSupabaseEnabled ? (
                <>
                  <p className="text-sm text-ink-muted mb-1">We sent a verification link to</p>
                  <p className="text-sm font-bold text-ink mb-5 break-all">{email}</p>
                  <p className="text-xs text-ink-muted mb-5">Click the link in the email to activate your account, then sign in.</p>
                  <AnimatePresence>
                    {err && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-sm text-rose-600">
                      <AlertCircle size={15} />{err}
                    </motion.div>}
                  </AnimatePresence>
                  <button onClick={resend} disabled={busy}
                    className="w-full py-3 rounded-xl btn-secondary font-bold mb-2 disabled:opacity-60 active:scale-95 transition">
                    {busy ? 'Sending…' : 'Resend Email'}
                  </button>
                  <button onClick={() => { setStep('form'); setIsReg(false); }} className="text-sm text-tangerine hover:text-tangerine-dark font-bold mt-2">
                    Back to sign in
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-muted mb-4">Enter the 4-digit code (demo: <span className="font-mono font-bold">1234</span>)</p>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)}
                    inputMode="numeric" maxLength={4}
                    className={inp + ' text-center text-xl tracking-widest pl-4'} placeholder="0000" />
                  <button onClick={verify} className="w-full mt-3 py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 font-bold active:scale-95 transition">Verify Account</button>
                </>
              )}
            </motion.div>
          )}

          {step === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl shadow-gold/10 border-2 border-gold-pale">
              <button onClick={() => setStep('form')} className="flex items-center gap-2 text-ink-muted hover:text-tangerine transition mb-5 text-sm">
                <ArrowLeft size={16} /> Back
              </button>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl btn-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gold/30">
                  <Mail size={24} className="text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gradient mb-1">Reset Password</h2>
                <p className="text-sm text-ink-muted">We'll send you a secure link by email.</p>
              </div>
              {err && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-sm text-rose-600">
                  <AlertCircle size={15} />{err}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inp} required />
                </div>
              </div>
              <button onClick={sendReset} disabled={busy}
                className="w-full mt-4 py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 font-bold text-sm disabled:opacity-60">
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </motion.div>
          )}

          {step === 'forgot-sent' && (
            <motion.div key="forgot-sent" initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center shadow-2xl border-2 border-green-200">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink mb-2">Check Your Inbox</h2>
              <p className="text-ink-muted text-sm mb-1">We sent a reset link to</p>
              <p className="text-ink font-bold text-sm break-all mb-5">{email}</p>
              <p className="text-xs text-ink-muted mb-5">Click the link in the email to set a new password.</p>
              <button onClick={() => setStep('form')} className="px-5 py-2.5 rounded-xl btn-secondary font-bold text-sm">
                Back to Sign In
              </button>
            </motion.div>
          )}

          {step === 'ok' && (
            <motion.div key="ok" initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-2xl border-2 border-green-200">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
                <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink mb-2">Welcome to starboundsgrp!</h2>
              <p className="text-ink-muted text-sm">Redirecting…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
