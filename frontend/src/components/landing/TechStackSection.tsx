'use client';

import { useScrollReveal } from './useScrollReveal';

const STACK = [
  {
    icon: '☁️',
    iconBg: 'bg-sp-cyan/15',
    title: 'IoT Platform',
    desc: 'Device registration, OTA firmware, shadow state, and rule engine for sensor fleet management at city scale.',
  },
  {
    icon: '🧠',
    iconBg: 'bg-sp-blue/15',
    title: 'Qwen-Max + Qwen-VL',
    desc: 'Powers the conversational AI assistant and vision-based verification. Qwen-Max handles NLU and planning; Qwen-VL validates sensor anomalies via camera feeds.',
  },
  {
    icon: '🗄️',
    iconBg: 'bg-sp-purple/15',
    title: 'PolarDB + AnalyticDB',
    desc: 'PolarDB stores real-time sensor state and booking data. AnalyticDB (PostgreSQL + vector) enables predictive queries and historical pattern analysis.',
  },
];

export default function TechStackSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-[120px] px-8 max-w-7xl mx-auto">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-sp-cyan uppercase tracking-[2px] mb-4">
        <span className="w-6 h-px bg-sp-cyan" />
        Technology Stack
      </span>
      <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
        Built on Alibaba Cloud.
      </h2>
      <p className="text-base text-sp-text-2 max-w-[600px] leading-relaxed">
        SpotSense uses the full Alibaba Cloud AI and IoT stack — from device connectivity to Qwen-powered agentic intelligence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {STACK.map((item) => (
          <div
            key={item.title}
            className="bg-sp-bg-2/70 border border-white/[0.08] rounded-2xl p-7 transition-all hover:border-white/15 hover:-translate-y-1"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-4 ${item.iconBg}`}>
              {item.icon}
            </div>
            <h3 className="text-[17px] font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-sp-text-2 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
