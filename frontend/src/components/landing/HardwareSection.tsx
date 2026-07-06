'use client';

import { useScrollReveal } from './useScrollReveal';

const SPECS = [
  { value: '$11.40', label: 'Unit BOM Cost', detail: 'ESP32-C6 + ToF + PV cell' },
  { value: '5yr', label: 'Battery Life', detail: 'Supercap buffer for nights' },
  { value: 'IP67', label: 'Weather Rating', detail: '-10°C to +65°C range' },
  { value: 'Thread', label: 'Mesh Protocol', detail: 'Zigbee fallback · BLE provisioning' },
  { value: 'ToF', label: 'Detection Method', detail: 'VL53L1X · 4m range · ±3cm' },
  { value: '<50mW', label: 'Avg Power Draw', detail: 'Deep sleep + event wake' },
  { value: 'OTA', label: 'Firmware Updates', detail: 'Delta updates over mesh' },
  { value: 'AES-256', label: 'Encryption', detail: 'End-to-end · Secure boot' },
];

export default function HardwareSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} id="sensors" className="py-[120px] px-8 max-w-7xl mx-auto">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-sp-cyan uppercase tracking-[2px] mb-4">
        <span className="w-6 h-px bg-sp-cyan" />
        Hardware
      </span>
      <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
        Light-powered. Zero grid electricity.
      </h2>
      <p className="text-base text-sp-text-2 max-w-[600px] leading-relaxed">
        Each sensor runs on an indoor photovoltaic cell harvesting ambient mall lighting. An ESP32-C6 with Thread/Zigbee radios handles edge inference. Total BOM cost: under $12 per unit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        {SPECS.map((spec) => (
          <div
            key={spec.label}
            className="bg-sp-bg-2/70 border border-white/[0.08] rounded-2xl p-6 text-center transition-all hover:border-sp-cyan hover:-translate-y-1"
          >
            <div className="text-[28px] font-extrabold font-mono text-sp-cyan">{spec.value}</div>
            <div className="text-xs text-sp-text-2 mt-1.5 font-medium">{spec.label}</div>
            <div className="text-[11px] text-sp-text-3 mt-1">{spec.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
