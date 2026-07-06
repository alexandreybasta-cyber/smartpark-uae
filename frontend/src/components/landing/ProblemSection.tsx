'use client';

import { useScrollReveal } from './useScrollReveal';

const PROBLEMS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
    iconBg: 'bg-sp-red/15',
    title: 'Wired Sensors Fail',
    desc: 'Traditional ultrasonic and magnetic sensors need cables, batteries, and frequent maintenance. Harsh UAE heat accelerates battery degradation.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    iconBg: 'bg-sp-amber/15',
    title: 'No Real-Time Intelligence',
    desc: 'Most parking systems show static data. No predictive guidance, no zone coordination, no integration with navigation apps like Parkin or RTA.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    iconBg: 'bg-sp-purple/15',
    title: 'Street Parking Is Invisible',
    desc: 'No way to know which block has open spots until you drive past. Drivers circle entire districts hoping for luck — wasting fuel and time with zero predictive guidance.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    iconBg: 'bg-red-500/15',
    title: 'Manual Enforcement Fails',
    desc: 'Inspectors can\'t cover every street — violators go undetected. Cities lose millions in unpaid parking revenue while paying for expensive manual patrols that cover only a fraction of spots.',
  },
];

export default function ProblemSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} id="problem" className="py-[120px] px-8 max-w-7xl mx-auto">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-sp-cyan uppercase tracking-[2px] mb-4">
        <span className="w-6 h-px bg-sp-cyan" />
        The Problem
      </span>
      <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
        30% of urban traffic is just<br />people looking for parking.
      </h2>
      <p className="text-base text-sp-text-2 max-w-[600px] leading-relaxed">
        In Dubai and Abu Dhabi, drivers spend an average of 20 minutes circling for spots — burning fuel, increasing emissions, and losing time. Existing solutions rely on expensive cameras and wired sensors that need constant maintenance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        {PROBLEMS.map((p) => (
          <div
            key={p.title}
            className="bg-sp-bg-2 border border-emerald-200 rounded-2xl p-7 transition-all hover:border-emerald-300 hover:-translate-y-1 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-4 ${p.iconBg}`}>
              {p.icon}
            </div>
            <h3 className="text-[17px] font-bold mb-2">{p.title}</h3>
            <p className="text-sm text-sp-text-2 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
