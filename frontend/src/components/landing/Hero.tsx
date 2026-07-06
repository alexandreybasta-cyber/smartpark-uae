'use client';

import { useScrollReveal } from './useScrollReveal';

const STATS = [
  { value: '2,400', unit: '+', label: 'Active Sensors' },
  { value: '<200', unit: 'ms', label: 'Edge Latency' },
  { value: '38', unit: '%', label: 'Less Search Time' },
  { value: '0', unit: 'W', label: 'Grid Power Used' },
];

export default function Hero() {
  const ref = useScrollReveal<HTMLElement>();

  const handleCTA = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center text-center overflow-hidden pt-[120px] pb-20 px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(0,229,160,0.08)_0%,transparent_50%),radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(59,130,246,0.06)_0%,transparent_50%),linear-gradient(180deg,#04060b_0%,#0a0e1a_100%)]" />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)',
        }}
      />
      {/* Content */}
      <div className="relative z-10 max-w-[800px]">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-3xl mb-8 bg-sp-bg-3 border border-white/[0.08] text-[13px] text-sp-text-2 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-sp-cyan animate-pulse-glow" />
          Qwen Cloud Challenge &middot; EdgeAgent Track
        </div>

        <h1 className="text-[clamp(42px,6vw,72px)] font-black leading-[1.05] tracking-[-0.03em] mb-6">
          Never Circle the<br />
          Lot{' '}
          <span className="bg-gradient-to-br from-sp-cyan via-sp-blue to-sp-purple bg-clip-text text-transparent">
            Again.
          </span>
        </h1>

        <p className="text-lg text-sp-text-2 max-w-[580px] mx-auto mb-10 leading-relaxed font-normal">
          Light-powered IoT sensors, edge AI, and agentic intelligence — transforming parking across UAE malls, streets, and airports in real time.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="#demo"
            onClick={handleCTA}
            className="px-8 py-3.5 rounded-xl text-[15px] font-semibold bg-sp-cyan text-sp-bg-0 inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,229,160,0.25)] transition-all no-underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            See Live Demo
          </a>
          <a
            href="#architecture"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#architecture')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-3.5 rounded-xl text-[15px] font-semibold bg-transparent text-sp-text-1 border border-white/15 inline-flex items-center gap-2 hover:border-sp-text-3 hover:bg-sp-bg-3 transition-all no-underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Architecture
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-12 justify-center mt-16 pt-12 border-t border-white/[0.08] flex-wrap">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-extrabold text-sp-text-1 font-mono">
                {stat.value}
                <span className="text-base text-sp-cyan font-medium">{stat.unit}</span>
              </div>
              <div className="text-xs text-sp-text-3 mt-1 uppercase tracking-wider font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
