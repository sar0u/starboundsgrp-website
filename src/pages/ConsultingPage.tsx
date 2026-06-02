import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MessageCircle, Star, CheckCircle, ArrowRight, User, Mail, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

const consultants = [
  { id: 'c1', name: 'James Davidson', role: 'Senior Colorist', rating: 4.9, reviews: 127, specialties: ['Color Grading', 'LUT Design', 'HDR'], avail: 'Mon, Wed, Fri', price: '$120/hr', init: 'JD' },
  { id: 'c2', name: 'Amber Brooks', role: 'Motion Designer', rating: 4.8, reviews: 94, specialties: ['Motion Graphics', 'Typography', 'AE'], avail: 'Tue, Thu, Sat', price: '$100/hr', init: 'AB' },
  { id: 'c3', name: 'Marcus Chen', role: 'Sound Engineer', rating: 5.0, reviews: 68, specialties: ['Sound Design', 'Mixing', 'Foley'], avail: 'Daily', price: '$90/hr', init: 'MC' },
];

const services = [
  { icon: MessageCircle, title: '1-on-1 Mentoring', desc: 'Personal guidance tailored to your goals' },
  { icon: FileText,      title: 'Project Review',   desc: 'Detailed feedback with actionable improvements' },
  { icon: Calendar,      title: 'Workflow Audit',   desc: 'Optimize your pipeline for max efficiency' },
];

export default function ConsultingPage() {
  const { notify, user } = useApp();
  const [sel, setSel] = useState<typeof consultants[0] | null>(null);
  const [step, setStep] = useState<'list' | 'form' | 'done'>('list');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const book = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { notify('error', 'Please sign in to book.'); return; }
    setStep('done');
    notify('success', 'Booking request sent!');
  };

  return (
    <div className="page-shell">
      <div className="page-inner max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient mb-1.5">Consulting</h2>
          <p className="text-ink-muted text-sm sm:text-base md:text-lg">Get personalized guidance from industry professionals</p>
        </motion.div>

        {step === 'list' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
              {services.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div key={s.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 + i * .07 }}
                    whileHover={{ y: -3 }} className="glass rounded-2xl p-5">
                    <div className="w-12 h-12 rounded-xl btn-primary flex items-center justify-center mb-3 shadow"><Icon size={22} className="text-white" /></div>
                    <h3 className="font-bold text-ink mb-1">{s.title}</h3>
                    <p className="text-sm text-ink-muted">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-ink mb-4">Our Experts</h3>
            <div className="space-y-3 sm:space-y-4">
              {consultants.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .15 + i * .07 }}
                  className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl btn-primary flex items-center justify-center text-white text-lg sm:text-xl font-extrabold flex-shrink-0 shadow-lg">{c.init}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <h4 className="font-bold text-ink text-base sm:text-lg">{c.name}</h4>
                      <div className="flex items-center gap-1 text-sm text-sun"><Star size={13} className="fill-sun" />{c.rating}</div>
                      <span className="text-xs text-ink-muted">({c.reviews} reviews)</span>
                    </div>
                    <p className="text-sm text-tangerine font-bold mb-2">{c.role}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">{c.specialties.map(s => <span key={s} className="tag">{s}</span>)}</div>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-ink-muted flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={13} />{c.avail}</span>
                      <span className="flex items-center gap-1"><Clock size={13} />{c.price}</span>
                    </div>
                  </div>
                  <button onClick={() => { setSel(c); setStep('form'); }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl btn-primary shadow-lg shadow-gold/20 flex items-center justify-center gap-2 text-sm active:scale-95 transition">
                    Book Session <ArrowRight size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {step === 'form' && sel && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-lg mx-auto border-2 border-gold-pale">
            <button onClick={() => setStep('list')} className="text-sm text-ink-muted hover:text-tangerine mb-4">← Back to experts</button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl btn-primary flex items-center justify-center text-white text-base sm:text-lg font-bold shadow shrink-0">{sel.init}</div>
              <div className="min-w-0">
                <h3 className="font-bold text-ink truncate">Book with {sel.name}</h3>
                <p className="text-sm text-ink-muted">{sel.role} · {sel.price}</p>
              </div>
            </div>
            <form onSubmit={book} className="space-y-3.5">
              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">Your Name</label>
                <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-white border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm" /></div>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">Email</label>
                <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={15} />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-white border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm" /></div>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">What do you need help with?</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm resize-none" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl btn-primary shadow-lg shadow-gold/25 font-bold active:scale-95 transition">
                Request Booking
              </button>
            </form>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border-2 border-green-200">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-ink mb-2">Booking Requested!</h3>
            <p className="text-ink-muted text-sm sm:text-base mb-6">We'll confirm your session within 24 hours.</p>
            <button onClick={() => setStep('list')} className="px-5 py-2.5 rounded-xl btn-primary font-bold active:scale-95 transition">
              Back to Consulting
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
