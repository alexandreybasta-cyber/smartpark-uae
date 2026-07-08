'use client';

import { useScrollReveal } from './useScrollReveal';
import PredictionChart from './PredictionChart';

const NODES = [
  { icon: '💡', title: 'Light-Powered Sensor', sub: 'ESP32-C6 · ToF · PV cell' },
  { icon: '📡', title: 'Thread Mesh', sub: 'Low-power · Self-healing' },
  { icon: '🖥️', title: 'Zone Gateway', sub: 'Raspberry Pi · Zone Agent' },
  { icon: '☁️', title: 'Alibaba Cloud', sub: 'IoT · Qwen · PolarDB', highlight: true },
  { icon: '📱', title: 'Driver App', sub: 'Payment · RTA · Maps' },
  { icon: '🛡️', title: 'Enforcement System', sub: 'Fines · Violations · 24/7' },
];

export default function ArchitectureSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} id="architecture" className="py-[120px] px-8 max-w-7xl mx-auto">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-sp-cyan uppercase tracking-[2px] mb-4">
        <span className="w-6 h-px bg-sp-cyan" />
        System Architecture
      </span>
      <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
        From sensor to smartphone<br />in under 200 milliseconds.
      </h2>
      <p className="text-base text-sp-text-2 max-w-[600px] leading-relaxed">
        A three-tier architecture: edge agents on each device, zone coordinators on gateway hardware, and the cloud platform on Alibaba Cloud for city-wide intelligence and API integrations.
      </p>

      {/* Architecture flow */}
      <div className="flex items-center justify-center gap-3 mt-12 flex-wrap">
        {NODES.map((node, i) => (
          <div key={node.title} className="contents">
            <div
              className={`px-6 py-5 rounded-2xl bg-sp-bg-2/70 border text-center min-w-[140px] transition-all hover:-translate-y-1 hover:border-sp-cyan ${
                node.highlight ? 'border-sp-cyan/30' : 'border-white/[0.08]'
              }`}
            >
              <div className="text-[28px] mb-2">{node.icon}</div>
              <div className="text-[13px] font-bold">{node.title}</div>
              <div className="text-[11px] text-sp-text-3 mt-0.5">{node.sub}</div>
            </div>
            {i < NODES.length - 1 && (
              <div className="text-xl text-sp-text-3 flex items-center max-md:rotate-90">→</div>
            )}
          </div>
        ))}
      </div>

      {/* Prediction Chart */}
      <div id="predict">
        <PredictionChart />
      </div>
    </section>
  );
}
