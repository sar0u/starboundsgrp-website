import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

const icons = { success: CheckCircle, error: XCircle, info: Info };
const colors = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error:   'border-rose-200 bg-rose-50 text-rose-700',
  info:    'border-gold/40 bg-sun-pale text-ink',
};

export default function Toast() {
  const { notifications } = useApp();
  return (
    <div
      className="fixed right-3 sm:right-4 z-[120] space-y-2 w-[calc(100%-1.5rem)] sm:w-80 max-w-sm pointer-events-none"
      style={{ top: 'calc(var(--nav-h) + 0.5rem)' }}
    >
      <AnimatePresence>
        {notifications.map((n) => {
          const Icon = icons[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg backdrop-blur-md ${colors[n.type]}`}
            >
              <Icon size={17} className="shrink-0" />
              <span className="text-sm font-medium min-w-0 break-words">{n.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
