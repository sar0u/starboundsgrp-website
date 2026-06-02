import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Film, BookOpen, Users, Music, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

const features = [
  { icon: Film,     title: 'Premium Scenepacks', desc: 'Curated high-quality footage packs for professional editors',  gradient: 'from-tangerine to-gold',           p: 1 },
  { icon: BookOpen, title: 'Expert Tutorials',   desc: 'Step-by-step guides from industry professionals',              gradient: 'from-gold to-sun',                 p: 2 },
  { icon: Users,    title: 'Creative Lounge',    desc: 'Collaborate and share ideas with fellow editors',              gradient: 'from-sun to-gold-bright',          p: 3 },
  { icon: Music,    title: 'Audio Library',      desc: 'Royalty-free music and sound effects collection',              gradient: 'from-gold-bright to-tangerine-light', p: 4 },
];

export default function HomePage({ onNavigate }: { onNavigate: (p: number) => void }) {
  const { user } = useApp();

  return (
    <div className="page-shell">
      <div className="page-inner flex flex-col justify-center min-h-full">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="mb-8 sm:mb-12">
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .1 }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-5 max-w-full ${user.role === 'admin' ? 'bg-gold-pale border border-sun text-tangerine-dark' : 'bg-sun-pale border border-gold-pale text-tangerine-dark'}`}
            >
              {user.role === 'admin' ? <Shield size={13} /> : <Sparkles size={13} />}
              <span className="truncate">Welcome back, {user.name}!</span>
            </motion.div>
          )}

          <h1 className="font-extrabold leading-[1.05] mb-4 sm:mb-5 text-[clamp(2.25rem,7vw,4.5rem)]">
            <span className="text-ink">Elevate Your</span><br />
            <span className="text-gradient">Editing Craft</span>
          </h1>

          <p className="text-ink-muted max-w-2xl mb-6 sm:mb-8 leading-relaxed text-[clamp(0.95rem,1.6vw,1.15rem)]">
            Join the premier community for video editors. Access premium scenepacks,
            master advanced techniques, and connect with creative professionals.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 max-w-md sm:max-w-none">
            <button
              onClick={() => onNavigate(1)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl btn-primary shadow-xl shadow-gold/30 text-sm sm:text-base active:scale-95 transition-transform"
            >
              Explore Scenepacks <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate(2)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl btn-secondary text-sm sm:text-base active:scale-95 transition-transform"
            >
              Browse Tutorials <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.button
                key={f.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .25 + i * .06 }}
                whileHover={{ y: -4 }}
                onClick={() => onNavigate(f.p)}
                className="glass rounded-2xl p-5 text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-md shadow-gold/20`}>
                  <Icon size={22} className="text-white" strokeWidth={2.25} />
                </div>
                <h3 className="font-bold text-ink mb-1 text-base">{f.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{f.desc}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Section labels */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .65 }}
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-ink-muted font-semibold"
        >
          <span>Scenepacks</span><span>Tutorials</span><span>Audio Library</span>
          <span>Community</span><span>Consulting</span>
        </motion.div>
      </div>
    </div>
  );
}
