'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { T } from '../enforce/tokens';

const HEADLINE_1 = 'The parking bay';
const HEADLINE_2 = 'just became an agent.';

const STATS = [
  { value: '< 60s', label: 'event → action' },
  { value: '$11', label: 'per-bay sensor BOM' },
  { value: '24/7', label: 'coverage · no cameras' },
  { value: '0', label: 'grid power needed' },
];

const MARQUEE = ['SENSE', 'CONNECT', 'REASON', 'ACT'];

function StaggerWords({ text, delay = 0, accent = false }: { text: string; delay?: number; accent?: boolean }) {
  return (
    <span className="inline-block">
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            style={accent ? { color: T.cyan } : undefined}
          >
            {word}
          </motion.span>
          {i < text.split(' ').length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

export default function AgenticHero() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: T.bg0 }}
    >
      {/* Aurora glows with scroll parallax */}
      <motion.div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{
          y: glowY,
          background: `radial-gradient(ellipse at center, ${T.cyan}22 0%, transparent 60%)`,
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          y: glowY,
          background: `radial-gradient(ellipse at center, ${T.purple}18 0%, transparent 60%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 35%, black 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 35%, black 25%, transparent 75%)',
        }}
      />

      <motion.div style={{ opacity: fadeOut }} className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-28 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-10 text-[13px] font-medium"
          style={{ backgroundColor: T.bg2, border: `1px solid ${T.border}`, color: T.text2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: T.cyan }} />
          Agentic IoT · Qwen Cloud Challenge · EdgeAgent Track
        </motion.div>

        <h1
          className="text-5xl md:text-[84px] font-black leading-[1.02] tracking-[-0.03em] mb-8"
          style={{ color: T.text1 }}
        >
          <StaggerWords text={HEADLINE_1} />
          <br />
          <StaggerWords text={HEADLINE_2} delay={0.35} accent />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="text-lg md:text-xl leading-relaxed max-w-[640px] mx-auto mb-12"
          style={{ color: T.text2 }}
        >
          A light-powered sensor in every painted bay. A Qwen agent in the cloud.
          Together they sense, reason and <em style={{ color: T.text1 }}>act on their own</em> —
          guiding drivers to free bays, and enforcement to unpaid ones.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="flex gap-4 justify-center flex-wrap mb-16"
        >
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            href="#agentic"
            className="px-8 py-4 rounded-2xl text-[15px] font-bold no-underline"
            style={{ backgroundColor: T.cyan, color: T.bg0 }}
          >
            What is agentic IoT?
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            href="#usecases"
            className="px-8 py-4 rounded-2xl text-[15px] font-semibold no-underline"
            style={{ color: T.text1, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            The two use cases
          </motion.a>
        </motion.div>

        <div className="flex justify-center gap-12 flex-wrap">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 + i * 0.12 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black tabular-nums" style={{ color: T.cyan }}>
                {s.value}
              </div>
              <div className="text-[12px] mt-1 font-mono" style={{ color: T.text3 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Marquee ticker */}
      <div
        className="relative z-10 py-5 overflow-hidden select-none"
        style={{ borderTop: `1px solid ${T.border}`, backgroundColor: 'rgba(10,14,26,0.6)' }}
      >
        <motion.div
          className="flex whitespace-nowrap will-change-transform"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {Array.from({ length: 4 }).flatMap((_, rep) =>
                MARQUEE.map((word, i) => (
                  <span
                    key={`${copy}-${rep}-${i}`}
                    className="mx-6 text-[15px] font-black tracking-[0.35em] font-mono flex items-center gap-6"
                    style={{ color: i === 3 ? T.cyan : T.text3 }}
                  >
                    {word}
                    <span style={{ color: T.bg3 }}>◆</span>
                  </span>
                ))
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
