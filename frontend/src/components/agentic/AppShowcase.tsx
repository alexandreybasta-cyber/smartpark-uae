'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { T } from '../enforce/tokens';

// Showcases the REAL native iOS app (ios/SmartPark, SwiftUI, iOS 17+).
// The Driver/Enforcement toggle mirrors the segmented control in the app's
// Settings tab; the phone contents replicate the actual screens.

type Mode = 'driver' | 'enforcement';

const CAPABILITIES = [
  { title: 'Live map, real sensors', desc: 'Every bay updates over WebSocket the moment a sensor state changes — zone polygons colored by availability.' },
  { title: 'Real Qwen agent', desc: 'qwen-plus via Alibaba DashScope answers with live zone context; backend agent first, Qwen fallback — never a dead demo.' },
  { title: 'Voice in, voice out', desc: 'On-device speech-to-text into the agent, spoken answers back — hands-free while driving or on patrol.' },
  { title: 'Violation intelligence', desc: 'Enforcement mode surfaces unpaid bays with plate, unpaid duration, and a recommended action: warn, fine, or tow.' },
  { title: 'Places & search', desc: 'Apple location search and saved places — "find parking near my work" resolves to a real coordinate.' },
  { title: 'Offline failover', desc: 'Backend unreachable? An on-device simulator takes over with the same time-of-day model. The demo cannot die.' },
];

export default function AppShowcase() {
  const [mode, setMode] = useState<Mode>('driver');

  return (
    <section id="app" className="py-28 px-6" style={{ backgroundColor: T.bg0, borderTop: `1px solid ${T.border}` }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <div className="text-[13px] font-bold tracking-[0.3em] font-mono mb-4" style={{ color: T.cyan }}>
            THE APP — NATIVE iOS
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5" style={{ color: T.text1 }}>
            Built. Running. <span style={{ color: T.cyan }}>On iPhone.</span>
          </h2>
          <p className="text-[16px] max-w-[600px] mx-auto" style={{ color: T.text2 }}>
            SwiftUI on iOS 17+ — MapKit, Swift Charts, live WebSocket data and a real Qwen agent.
            One app, two modes: the same toggle lives in the app&apos;s Settings.
          </p>
        </motion.div>

        {/* Mode toggle — mirrors the app's segmented control */}
        <div className="flex justify-center mb-14">
          <div className="flex p-1 rounded-full" style={{ backgroundColor: T.bg3 }}>
            {(['driver', 'enforcement'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="relative px-6 py-2.5 rounded-full text-[14px] font-bold transition-colors cursor-pointer"
                style={{ color: mode === m ? '#ffffff' : T.text2 }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="mode-thumb"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: m === 'driver' ? T.cyan : T.red }}
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                  />
                )}
                <span className="relative z-10">{m === 'driver' ? 'Driver' : 'Enforcement'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phones */}
        <div className="flex justify-center gap-10 flex-wrap mb-20">
          <PhoneFrame label={mode === 'driver' ? 'Map — find free bays' : 'Map — active violations'}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="h-full"
              >
                <MapScreen mode={mode} />
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>

          <PhoneFrame label={mode === 'driver' ? 'Agent — parking copilot' : 'Agent — patrol assistant'}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="h-full"
              >
                <AgentScreen mode={mode} />
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </div>

        {/* Capability grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {CAPABILITIES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.12 }}
              className="rounded-2xl p-6"
              style={{ backgroundColor: T.bg2, border: `1px solid ${T.border}`, boxShadow: '0 4px 16px rgba(15,23,42,0.05)' }}
            >
              <div className="w-2.5 h-2.5 rounded-full mb-4" style={{ backgroundColor: T.cyan }} />
              <h3 className="text-[15.5px] font-bold mb-2" style={{ color: T.text1 }}>
                {c.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: T.text2 }}>
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ————— Phone frame —————

function PhoneFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-[280px] h-[580px] rounded-[46px] p-[10px]"
        style={{ backgroundColor: '#1e293b', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}
      >
        <div className="relative w-full h-full rounded-[36px] overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          {/* Dynamic island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[24px] rounded-full z-20" style={{ backgroundColor: '#1e293b' }} />
          {children}
        </div>
      </div>
      <span className="text-[13px] font-mono" style={{ color: T.text3 }}>
        {label}
      </span>
    </div>
  );
}

// ————— Map screen replica —————

const DRIVER_DOTS = [
  { x: 18, y: 30, c: T.green }, { x: 34, y: 34, c: T.red }, { x: 52, y: 28, c: T.green },
  { x: 68, y: 36, c: T.green }, { x: 24, y: 52, c: T.red }, { x: 44, y: 56, c: T.green },
  { x: 62, y: 50, c: T.amber }, { x: 78, y: 55, c: T.green }, { x: 36, y: 70, c: T.red },
  { x: 56, y: 68, c: T.green },
];

function MapScreen({ mode }: { mode: Mode }) {
  const violations = [
    { x: 30, y: 34 }, { x: 58, y: 30 }, { x: 42, y: 54 }, { x: 70, y: 50 }, { x: 52, y: 70 },
  ];

  return (
    <div className="relative h-full" style={{ backgroundColor: '#eef2f6' }}>
      {/* faux streets */}
      <div className="absolute inset-x-0 top-[38%] h-3" style={{ backgroundColor: '#e2e8f0' }} />
      <div className="absolute inset-x-0 top-[62%] h-3" style={{ backgroundColor: '#e2e8f0' }} />
      <div className="absolute inset-y-0 left-[45%] w-3" style={{ backgroundColor: '#e2e8f0' }} />

      {/* zone polygon tints */}
      <div className="absolute left-[8%] top-[26%] w-[38%] h-[18%] rounded-lg" style={{ backgroundColor: `${T.green}18`, border: `1.5px solid ${T.green}66` }} />
      <div className="absolute left-[54%] top-[46%] w-[38%] h-[18%] rounded-lg" style={{ backgroundColor: `${T.amber}18`, border: `1.5px solid ${T.amber}66` }} />

      {/* search bar */}
      <div className="absolute top-11 inset-x-4 h-9 rounded-xl flex items-center px-3 gap-2 z-10"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(15,23,42,0.12)' }}>
        <span style={{ color: T.text3, fontSize: 13 }}>⌕</span>
        <span className="text-[12px]" style={{ color: T.text3 }}>Search location…</span>
      </div>

      {/* mode badge */}
      {mode === 'enforcement' && (
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white z-10"
          style={{ backgroundColor: T.red }}>
          ⚠ 5 VIOLATIONS
        </div>
      )}

      {/* dots */}
      {mode === 'driver'
        ? DRIVER_DOTS.map((d, i) => (
            <div key={i} className="absolute w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ left: `${d.x}%`, top: `${d.y}%`, backgroundColor: d.c, boxShadow: '0 1px 3px rgba(15,23,42,0.3)' }} />
          ))
        : violations.map((v, i) => (
            <div key={i} className="absolute w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black"
              style={{ left: `${v.x}%`, top: `${v.y}%`, width: 18, height: 18, backgroundColor: T.red, boxShadow: `0 1px 4px ${T.red}66` }}>
              !
            </div>
          ))}

      {/* bottom card */}
      <div className="absolute bottom-16 inset-x-3 rounded-2xl p-3.5 z-10"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 -2px 16px rgba(15,23,42,0.12)' }}>
        {mode === 'driver' ? (
          <>
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ color: T.green, fontSize: 13 }}>✓</span>
              <span className="text-[13px] font-bold" style={{ color: T.text1 }}>Parking Found</span>
            </div>
            <div className="flex justify-around mb-2.5">
              {[{ v: '6', l: 'Free Spots', c: T.green }, { v: '120m', l: 'Nearest', c: T.cyan }, { v: '2 min', l: 'Walk', c: T.text1 }].map((s) => (
                <div key={s.l} className="text-center">
                  <div className="text-[16px] font-black" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[9.5px]" style={{ color: T.text2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white" style={{ backgroundColor: T.cyan }}>
              Navigate to Nearest
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-bold" style={{ color: T.text1 }}>Spot A-09</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: T.bg3, color: T.text1 }}>D 12345</span>
            </div>
            <div className="text-[11px] mb-2.5" style={{ color: T.red }}>Unpaid 45 min · grace expired</div>
            <div className="h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white" style={{ backgroundColor: T.red }}>
              Issue Fine (AED 200)
            </div>
          </>
        )}
      </div>

      {/* tab bar */}
      <TabBarMini active={0} />
    </div>
  );
}

// ————— Agent screen replica —————

function AgentScreen({ mode }: { mode: Mode }) {
  return (
    <div className="relative h-full flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      {/* nav title */}
      <div className="pt-11 pb-2.5 text-center border-b" style={{ borderColor: T.border }}>
        <span className="text-[14px] font-bold" style={{ color: T.text1 }}>
          {mode === 'driver' ? 'Parking Agent' : 'Enforce Agent'}
        </span>
        <span className="absolute right-4 top-11 text-[13px]" style={{ color: T.cyan }}>🔊</span>
      </div>

      {/* chat */}
      <div className="flex-1 px-3 py-3 flex flex-col gap-2.5 text-[11.5px] leading-snug overflow-hidden">
        <div className="self-end max-w-[85%] px-3 py-2 rounded-2xl rounded-br-md text-white" style={{ backgroundColor: T.cyan }}>
          {mode === 'driver' ? 'Find parking near my work' : 'Any violations on my route?'}
        </div>

        <div className="self-start max-w-[90%] px-2.5 py-2 rounded-lg" style={{ backgroundColor: T.bg1, borderLeft: `2px solid ${T.purple}` }}>
          {(mode === 'driver'
            ? ['Checked nearby zones', 'Compared availability + price', 'Selected best option']
            : ['Scanned 7 violations', 'Filtered 6 expired grace periods', 'Prioritized by duration']
          ).map((s) => (
            <div key={s} className="flex gap-1.5 py-0.5" style={{ color: T.text2 }}>
              <span style={{ color: T.purple }}>✓</span>{s}
            </div>
          ))}
        </div>

        <div className="self-start max-w-[90%] px-3 py-2 rounded-2xl rounded-bl-md" style={{ backgroundColor: T.bg1, color: T.text1 }}>
          {mode === 'driver'
            ? 'Block A has 8 free spots at AED 4/hr — closest to DIC Building 3, about a 3 min walk. Want me to navigate you there?'
            : 'Priority: Spot A-09, plate D 12345 — unpaid 45 min. Recommended: issue fine (AED 200). Two more on Block B within 300m.'}
        </div>

        {mode === 'driver' && (
          <div className="self-start rounded-xl p-2.5 w-[85%]" style={{ backgroundColor: '#ffffff', border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold" style={{ color: T.text1 }}>DIC Block A</span>
              <span style={{ color: T.text2, fontSize: 10 }}>AED 4/hr</span>
            </div>
            <span style={{ color: T.green }} className="font-black text-[15px]">8</span>
            <span style={{ color: T.text2, fontSize: 10 }}>/18 free · 3 min walk</span>
          </div>
        )}

        <div className="self-start px-3 py-1.5 rounded-full text-white text-[10.5px] font-bold" style={{ backgroundColor: T.cyan }}>
          🗺 Show on Map
        </div>
      </div>

      {/* input bar */}
      <div className="px-3 py-2.5 flex items-center gap-2 border-t mb-12" style={{ borderColor: T.border, backgroundColor: T.bg1 }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffffff', border: `1px solid ${T.border}` }}>
          <span style={{ color: T.cyan, fontSize: 12 }}>🎤</span>
        </div>
        <div className="flex-1 h-7 rounded-lg px-2.5 flex items-center text-[10.5px]" style={{ backgroundColor: '#ffffff', border: `1px solid ${T.border}`, color: T.text3 }}>
          {mode === 'driver' ? 'Find parking near…' : 'Ask about violations…'}
        </div>
        <span style={{ color: T.cyan, fontSize: 16 }}>➤</span>
      </div>

      <TabBarMini active={1} />
    </div>
  );
}

// ————— Mini tab bar —————

function TabBarMini({ active }: { active: number }) {
  const tabs = ['Map', 'Agent', 'Places', 'Insights', 'Settings'];
  return (
    <div className="absolute bottom-0 inset-x-0 h-12 flex items-center justify-around border-t z-10"
      style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: T.border }}>
      {tabs.map((t, i) => (
        <div key={t} className="flex flex-col items-center gap-0.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: i === active ? T.cyan : '#cbd5e1' }} />
          <span className="text-[8px] font-semibold" style={{ color: i === active ? T.cyan : T.text3 }}>{t}</span>
        </div>
      ))}
    </div>
  );
}
