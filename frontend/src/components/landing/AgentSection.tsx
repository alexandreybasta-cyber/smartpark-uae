'use client';

import { useScrollReveal } from './useScrollReveal';
import ChatWidget from './ChatWidget';

const AGENTS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sp-cyan)" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    iconBg: 'bg-sp-cyan/15',
    title: 'Edge Sensor Agent',
    subtitle: 'Runs on each light-powered device',
    desc: 'Makes local occupancy decisions in <200ms. Filters noise from shadows and passing traffic. Sends compressed state updates to the zone coordinator only when status changes — minimizing bandwidth.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sp-blue)" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    iconBg: 'bg-sp-blue/15',
    title: 'Zone Coordinator Agent',
    subtitle: 'Aggregates block-level data',
    desc: 'Aggregates data from all sensors in a zone. Balances traffic across rows to prevent congestion. Detects anomalies — a spot occupied for 12+ hours triggers an alert.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sp-purple)" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    iconBg: 'bg-sp-purple/15',
    title: 'Prediction Agent',
    subtitle: 'Forecasts availability patterns',
    desc: 'Learns from historical patterns, events, weather, and time of day. Predicts spot availability 30 minutes ahead with 94% accuracy. Flags peak hours and suggests alternative zones.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sp-amber)" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    iconBg: 'bg-sp-amber/15',
    title: 'Driver Guidance Agent',
    subtitle: 'Conversational navigation interface',
    desc: 'Natural-language interface integrated with Parkin and RTA apps. Guides drivers to the nearest available spot, answers questions about availability, and proactively suggests alternatives.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sp-red, #ef4444)" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
    iconBg: 'bg-red-500/15',
    title: 'Enforcement Agent',
    subtitle: 'Automated violation detection',
    desc: 'Detects occupied spots, cross-checks payment status with Parkin. Flags unpaid vehicles automatically — no inspectors needed. Covers 100% of monitored streets 24/7.',
  },
];

export default function AgentSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} id="agents" className="py-[120px] px-8 max-w-7xl mx-auto">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-sp-cyan uppercase tracking-[2px] mb-4">
        <span className="w-6 h-px bg-sp-cyan" />
        Agentic Intelligence
      </span>
      <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
        Five AI agents that think,<br />coordinate, and enforce.
      </h2>
      <p className="text-base text-sp-text-2 max-w-[600px] leading-relaxed">
        The agentic layer is where SpotSense becomes intelligent. Five specialized agents work together — on-device, at zone level, across the city, in conversation with drivers, and enforcing parking compliance.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 items-start">
        {/* Agent cards */}
        <div className="flex flex-col gap-5">
          {AGENTS.map((agent) => (
            <div
              key={agent.title}
              className="p-6 bg-sp-bg-2 border border-emerald-200 rounded-2xl transition-all hover:border-emerald-300 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${agent.iconBg}`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold">{agent.title}</h3>
                  <span className="text-[11px] text-sp-text-3">{agent.subtitle}</span>
                </div>
              </div>
              <p className="text-[13px] text-sp-text-2 leading-relaxed">{agent.desc}</p>
            </div>
          ))}
        </div>

        {/* Chat Widget */}
        <ChatWidget />
      </div>
    </section>
  );
}
