'use client';

import { motion } from 'motion/react';
import { T } from '../enforce/tokens';

// "One platform. Two missions." — the two use cases, side by side.

const CASES = [
  {
    index: '01',
    color: T.cyan,
    kicker: 'DRIVER COPILOT',
    title: 'Find. Park. Pay.',
    body: 'A driver asks — by voice — "any parking near my work?" The agent knows every free bay in real time, ranks by distance and predicted availability, navigates them in, and hands off payment.',
    points: ['Voice-first, Arabic & English', 'Ranked by distance + prediction', 'Deep-links into the parking app to pay'],
    demo: 'driver' as const,
  },
  {
    index: '02',
    color: T.red,
    kicker: 'ENFORCEMENT',
    title: 'Detect. Flag. Fine.',
    body: 'The same sensor sees a car with no active parking session. Grace timer runs out — the bay is flagged to the authority platform and the nearest ANPR patrol is routed straight to it. The existing RTA fine system closes the loop.',
    points: ['No more blind camera-car sweeps', 'Patrols routed by the agent', 'Fine confirmation synced back'],
    demo: 'enforce' as const,
    href: '#concept',
  },
];

export default function UseCases() {
  return (
    <section
      id="usecases"
      className="py-28 px-6"
      style={{ backgroundColor: T.bg1, borderTop: `1px solid ${T.border}` }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="text-[13px] font-bold tracking-[0.3em] font-mono mb-4" style={{ color: T.purple }}>
            THE TWO USE CASES
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight" style={{ color: T.text1 }}>
            One platform. <span style={{ color: T.purple }}>Two missions.</span>
          </h2>
          <p className="mt-5 text-[16px] max-w-[560px] mx-auto" style={{ color: T.text2 }}>
            The same sensors, the same mesh, the same agent — serving the driver on one side
            and the authority on the other.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {CASES.map((c, i) => (
            <motion.div
              key={c.index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              whileHover={{ y: -8 }}
              className="rounded-3xl p-8 flex flex-col"
              style={{ backgroundColor: T.bg2, border: `1px solid ${c.color}35` }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[44px] font-black font-mono leading-none" style={{ color: `${c.color}55` }}>
                  {c.index}
                </span>
                <span
                  className="text-[11px] font-black tracking-[0.3em] font-mono px-3 py-1.5 rounded-full"
                  style={{ color: c.color, border: `1px solid ${c.color}55`, backgroundColor: `${c.color}10` }}
                >
                  {c.kicker}
                </span>
              </div>

              <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: T.text1 }}>
                {c.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed mb-6" style={{ color: T.text2 }}>
                {c.body}
              </p>

              <ul className="space-y-2.5 mb-8">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[13.5px] items-baseline" style={{ color: T.text2 }}>
                    <span style={{ color: c.color }}>▸</span>
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {c.demo === 'driver' ? <DriverMiniDemo /> : <EnforceMiniDemo />}
                {c.href && (
                  <a
                    href={c.href}
                    className="inline-flex items-center gap-2 mt-6 text-[13px] font-bold no-underline"
                    style={{ color: c.color }}
                  >
                    See the full enforcement flow
                    <motion.span animate={{ y: [0, 3, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>↓</motion.span>
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Looping mini chat: driver asks, agent answers.
function DriverMiniDemo() {
  return (
    <div className="rounded-2xl p-4 space-y-2.5" style={{ backgroundColor: T.bg0, border: `1px solid ${T.border}` }}>
      <motion.div
        className="ml-auto w-fit max-w-[85%] px-3.5 py-2 rounded-xl rounded-br-sm text-[12.5px]"
        style={{ backgroundColor: T.cyan, color: '#fff' }}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        🎙 “Any parking near my work?”
      </motion.div>
      <motion.div
        className="w-fit max-w-[90%] px-3.5 py-2 rounded-xl rounded-bl-sm text-[12.5px] leading-relaxed"
        style={{ backgroundColor: T.bg3, color: T.text1, border: `1px solid ${T.border}` }}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.1 }}
      >
        Bay <span className="font-mono font-bold" style={{ color: T.green }}>314-09</span> is free —
        2 min walk. Navigating… payment ready in the parking app.
      </motion.div>
    </div>
  );
}

// Looping mini violation: bay flips red, patrol routed.
function EnforceMiniDemo() {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: T.bg0, border: `1px solid ${T.border}` }}>
      <div className="flex gap-1.5">
        {[T.green, T.green, T.red, T.green].map((c, i) => (
          <motion.div
            key={i}
            className="w-7 h-11 rounded-md"
            style={{ border: `1.5px solid ${c}`, backgroundColor: `${c}12` }}
            animate={i === 2 ? { opacity: [1, 0.35, 1] } : undefined}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        ))}
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-mono mb-1" style={{ color: T.red }}>
          BAY 312-05 · unpaid 12 min
        </div>
        <motion.div
          className="text-[12.5px] font-semibold"
          style={{ color: T.text1 }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          → Patrol P-07 routed · ETA 90s
        </motion.div>
      </div>
    </div>
  );
}
