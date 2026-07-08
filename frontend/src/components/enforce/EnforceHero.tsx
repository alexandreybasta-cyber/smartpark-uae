'use client';

import { useEffect, useState } from 'react';
import { T } from './tokens';

const STATS = [
  { value: '< 60s', label: 'violation detection' },
  { value: '24/7', label: 'every bay covered' },
  { value: '−85%', label: 'patrol distance*' },
  { value: '0', label: 'grid power needed' },
];

export default function EnforceHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center text-center overflow-hidden px-6 pt-24 pb-16"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,160,0.08) 0%, transparent 50%),
                     radial-gradient(ellipse 60% 40% at 80% 80%, rgba(239,68,68,0.06) 0%, transparent 50%),
                     linear-gradient(180deg, ${T.bg0} 0%, ${T.bg1} 100%)`,
      }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)',
        }}
      />

      <div
        className="relative z-10 max-w-[820px] transition-all duration-1000"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)' }}
      >
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-[13px] font-medium"
          style={{ backgroundColor: T.bg3, border: `1px solid ${T.border}`, color: T.text2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: T.red }} />
          Built for RTA &amp; Dubai Police — parking compliance, automated
        </div>

        <h1
          className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          style={{ color: T.text1 }}
        >
          Every unpaid bay.
          <br />
          <span style={{ color: T.cyan }}>Flagged in seconds.</span>
        </h1>

        <p className="text-lg leading-relaxed max-w-[600px] mx-auto mb-10" style={{ color: T.text2 }}>
          A light-powered sensor in every parking bay, cross-checked live against operator payments.
          No payment after the grace period? The violation is pushed to the authority platform and the
          nearest ANPR patrol is routed <em>straight to the car</em> — no more blind street sweeps.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-14">
          <a
            href="#concept"
            className="px-8 py-3.5 rounded-xl text-[15px] font-bold no-underline transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: T.cyan, color: T.bg0 }}
          >
            See how it works
          </a>
          <a
            href="#agent"
            className="px-8 py-3.5 rounded-xl text-[15px] font-semibold no-underline transition-colors"
            style={{ color: T.text1, border: '1px solid rgba(255,255,255,0.15)' }}
          >
            Talk to the patrol agent
          </a>
        </div>

        <div className="flex justify-center gap-10 flex-wrap">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black" style={{ color: T.cyan }}>
                {s.value}
              </div>
              <div className="text-[12px] mt-1" style={{ color: T.text3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div className="text-[11px] mt-6" style={{ color: T.text3 }}>
          *projected vs. camera-car street sweeps — demo figures
        </div>
      </div>
    </section>
  );
}
