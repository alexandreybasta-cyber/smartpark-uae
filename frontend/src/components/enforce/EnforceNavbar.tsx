'use client';

import { motion, useScroll } from 'motion/react';
import { T } from './tokens';

const LINKS = [
  { href: '#agentic', label: 'Concept' },
  { href: '#usecases', label: 'Use cases' },
  { href: '#agent', label: 'Patrol Agent' },
  { href: '#schema', label: 'How it works' },
];

export default function EnforceNavbar() {
  const { scrollYProgress } = useScroll();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{ backgroundColor: 'rgba(4,6,11,0.75)', borderBottom: `1px solid ${T.border}` }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-baseline gap-2 no-underline">
          <span className="text-[17px] font-black tracking-tight" style={{ color: T.text1 }}>
            SmartPark
          </span>
          <span
            className="text-[11px] font-bold tracking-[0.2em] px-2 py-0.5 rounded"
            style={{ color: T.bg0, backgroundColor: T.cyan }}
          >
            AGENTIC IOT
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium no-underline transition-colors hover:opacity-100 opacity-80"
              style={{ color: T.text2 }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div
          className="flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-full"
          style={{ color: T.text2, border: `1px solid ${T.border}`, backgroundColor: T.bg2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: T.cyan }} />
          Qwen Cloud Challenge · EdgeAgent Track
        </div>
      </div>

      {/* Scroll progress */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
        style={{ scaleX: scrollYProgress, backgroundColor: T.cyan }}
      />
    </nav>
  );
}
