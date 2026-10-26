import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function BrandEntrance({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleDismiss = React.useCallback(() => {
    sessionStorage.setItem('amit_brand_entrance_seen', 'true');
    setVisible(false);
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    // Check if intro has been shown this session
    const hasSeenIntro = sessionStorage.getItem('amit_brand_entrance_seen');
    if (hasSeenIntro) {
      setVisible(false);
      onCompleteRef.current();
      return;
    }

    const timer = setTimeout(handleDismiss, 1800);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="brand-entrance"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none"
          style={{ backgroundColor: 'var(--brand-cherry)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
        >
          {/* Skip Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-6 right-6 px-3 py-1.5 rounded-lg text-xs font-semibold border text-stone-400 hover:text-white transition-colors"
            style={{ borderColor: 'rgba(227, 221, 211, 0.2)' }}
          >
            Skip Intro →
          </button>
          {/* Orbital path motif */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            <svg
              viewBox="0 0 300 300"
              className="absolute inset-0 w-full h-full"
              aria-hidden="true"
            >
              <motion.circle
                cx="150"
                cy="150"
                r="110"
                fill="none"
                stroke="rgba(247, 165, 27, 0.25)"
                strokeWidth="1.2"
                strokeDasharray="6 6"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              />
              <motion.ellipse
                cx="150"
                cy="150"
                rx="135"
                ry="55"
                fill="none"
                stroke="rgba(225, 178, 112, 0.4)"
                strokeWidth="1"
                initial={{ rotate: -25, pathLength: 0 }}
                animate={{ rotate: -25, pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="270"
                cy="150"
                r="3.5"
                fill="var(--brand-amber)"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.6, duration: 0.4 }}
              />
            </svg>

            {/* Wordmark */}
            <div className="text-center z-10">
              <motion.p
                className="section-label text-xs tracking-widest uppercase mb-1"
                style={{ color: 'var(--brand-gold)' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                Learn with purpose
              </motion.p>
              <motion.h1
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight"
                style={{ color: 'var(--brand-ivory)' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                AMIT ACADEMY
              </motion.h1>
              <motion.div
                className="mx-auto mt-3 h-0.5"
                style={{
                  background: 'linear-gradient(90deg, transparent, var(--brand-amber), var(--brand-gold), transparent)',
                }}
                initial={{ width: 0 }}
                animate={{ width: 140 }}
                transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
              />
              <motion.p
                className="text-xs mt-3 tracking-wide"
                style={{ color: 'rgba(227, 221, 211, 0.65)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                Master with confidence.
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
