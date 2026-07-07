'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useRef, useState } from 'react';
import { T } from '../enforce/tokens';

// Scroll-driven sticky explainer: the four beats of agentic IoT.
// The section is 400vh tall; the viewport pins and the stage follows scroll.

const STAGES = [
  {
    id: 'sense',
    index: '01',
    title: 'SENSE',
    color: T.green,
    heading: 'Every painted bay gets a nervous system',
    body: 'A light-powered ToF sensor sits in each bay. It knows the moment a car arrives — day or night, no cameras, no wiring, no grid power. One bay, one sensor, eleven dollars.',
  },
  {
    id: 'connect',
    index: '02',
    title: 'CONNECT',
    color: T.blue,
    heading: 'Bays talk to each other, then to the cloud',
    body: 'Sensors form a self-healing Thread mesh. One gateway per block streams every state change to Alibaba Cloud in under a second. A whole district becomes one live dataset.',
  },
  {
    id: 'reason',
    index: '03',
    title: 'REASON',
    color: T.cyan,
    heading: 'A Qwen agent thinks about every event',
    body: 'This is what makes the IoT agentic. For every occupied bay the agent evaluates context: Is there a Parkin session? How long has it been unpaid? Who needs to know — a driver looking for a spot, or a patrol two streets away?',
  },
  {
    id: 'act',
    index: '04',
    title: 'ACT',
    color: T.purple,
    heading: 'Then it acts — on its own',
    body: 'No dashboard-watching. The agent guides a driver to the nearest free bay, or flags a violation and routes the closest patrol. Humans join by voice, in Arabic or English. That is the loop: sense → reason → act.',
  },
];

export default function AgenticConcept() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const [stage, setStage] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setStage(Math.min(STAGES.length - 1, Math.max(0, Math.floor(v * STAGES.length))));
  });

  const s = STAGES[stage];

  return (
    <div id="agentic" ref={containerRef} className="relative" style={{ height: '400vh', backgroundColor: T.bg0 }}>
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden px-6" style={{ borderTop: `1px solid ${T.border}` }}>
        {/* Section kicker */}
        <div className="max-w-6xl mx-auto w-full mb-8">
          <div className="text-[13px] font-bold tracking-[0.3em] font-mono" style={{ color: T.cyan }}>
            THE CONCEPT — AGENTIC IOT
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-14 items-center flex-1 max-h-[560px]">
          {/* Left: stage rail + text */}
          <div>
            {/* progress rail */}
            <div className="flex gap-2 mb-10">
              {STAGES.map((st, i) => (
                <div key={st.id} className="h-1 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: T.bg3 }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: st.color }}
                    animate={{ width: i < stage ? '100%' : i === stage ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-baseline gap-4 mb-5">
                  <span className="text-[15px] font-mono font-bold" style={{ color: s.color }}>
                    {s.index}
                  </span>
                  <span
                    className="text-[13px] font-black tracking-[0.4em] font-mono px-3 py-1 rounded"
                    style={{ color: '#ffffff', backgroundColor: s.color }}
                  >
                    {s.title}
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.08] mb-6" style={{ color: T.text1 }}>
                  {s.heading}
                </h2>
                <p className="text-[16px] leading-relaxed max-w-[480px]" style={{ color: T.text2 }}>
                  {s.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: stage visual */}
          <div
            className="relative rounded-3xl h-[380px] md:h-[440px] overflow-hidden"
            style={{ backgroundColor: T.bg1, border: `1px solid ${T.border}` }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={s.id}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.45 }}
              >
                <StageVisual stage={stage} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* scroll hint */}
        <div className="max-w-6xl mx-auto w-full mt-8 text-[12px] font-mono flex items-center gap-2" style={{ color: T.text3 }}>
          <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>↓</motion.span>
          keep scrolling — {stage + 1}/{STAGES.length}
        </div>
      </div>
    </div>
  );
}

function StageVisual({ stage }: { stage: number }) {
  if (stage === 0) return <SenseVisual />;
  if (stage === 1) return <ConnectVisual />;
  if (stage === 2) return <ReasonVisual />;
  return <ActVisual />;
}

// 01 — bay with pulsing sensor
function SenseVisual() {
  return (
    <div className="relative">
      <div
        className="w-[240px] h-[130px] rounded-xl relative"
        style={{ border: '2px dashed #cbd5e1' }}
      >
        <motion.div
          className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-[58px] rounded-xl"
          style={{ backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1' }}
          initial={{ x: 160, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <motion.div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: T.green }}
            animate={{ boxShadow: [`0 0 0 0px ${T.green}66`, `0 0 0 18px ${T.green}00`] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </div>
      </div>
      <div className="mt-6 text-center font-mono text-[12px]" style={{ color: T.text3 }}>
        ToF sensor · solar + supercap · IP67
      </div>
    </div>
  );
}

// 02 — mesh nodes connecting up to cloud
function ConnectVisual() {
  const nodes = [
    { x: 30, y: 150 }, { x: 110, y: 180 }, { x: 190, y: 150 }, { x: 270, y: 180 },
  ];
  return (
    <svg viewBox="0 0 300 220" className="w-[80%]">
      {/* cloud */}
      <motion.rect
        x={100} y={16} width={100} height={36} rx={12}
        fill={T.bg2} stroke={T.blue} strokeWidth={1.5}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
      />
      <motion.text x={150} y={39} textAnchor="middle" fontSize={11} fontFamily="monospace" fill={T.text1}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        Alibaba Cloud
      </motion.text>
      {/* gateway */}
      <motion.circle cx={150} cy={110} r={13} fill={T.bg2} stroke={T.blue} strokeWidth={2}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} />
      <motion.line x1={150} y1={97} x2={150} y2={52} stroke={T.blue} strokeWidth={1.5} strokeDasharray="5 4"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.5 }} />
      {/* sensors + mesh links */}
      {nodes.map((n, i) => (
        <g key={i}>
          <motion.circle cx={n.x} cy={n.y} r={7} fill={T.green}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.12, type: 'spring' }} />
          <motion.line x1={n.x} y1={n.y} x2={150} y2={110} stroke={T.green} strokeWidth={1} opacity={0.5}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }} />
        </g>
      ))}
      {/* travelling pulse */}
      <motion.circle r={3.5} fill={T.green}
        animate={{ cx: [30, 150, 150], cy: [150, 110, 52], opacity: [1, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.6, times: [0, 0.5, 1] }} />
    </svg>
  );
}

// 03 — agent core with orbiting context chips
function ReasonVisual() {
  const chips = [
    { label: 'Parkin session?', angle: 0 },
    { label: 'unpaid 12 min', angle: 90 },
    { label: 'patrol 240m', angle: 180 },
    { label: 'driver nearby?', angle: 270 },
  ];
  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      {/* core */}
      <motion.div
        className="w-24 h-24 rounded-full flex items-center justify-center text-[12px] font-black font-mono z-10"
        style={{ backgroundColor: T.bg2, border: `2px solid ${T.purple}`, color: T.text1 }}
        animate={{ boxShadow: [`0 0 24px ${T.purple}33`, `0 0 48px ${T.purple}66`, `0 0 24px ${T.purple}33`] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        QWEN
      </motion.div>
      {/* orbit ring */}
      <motion.div
        className="absolute w-[240px] h-[240px] rounded-full"
        style={{ border: `1px dashed ${T.purple}44` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />
      {/* chips */}
      {chips.map((c, i) => {
        const rad = (c.angle * Math.PI) / 180;
        const x = Math.cos(rad) * 120;
        const y = Math.sin(rad) * 120;
        return (
          <motion.div
            key={c.label}
            className="absolute px-3 py-1.5 rounded-full text-[11px] font-mono whitespace-nowrap"
            style={{
              backgroundColor: T.bg2,
              border: `1px solid ${T.purple}55`,
              color: T.text2,
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              translate: '-50% -50%',
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0.4, 1], scale: 1 }}
            transition={{ duration: 3, delay: i * 0.4, repeat: Infinity, repeatDelay: 1 }}
          >
            {c.label}
          </motion.div>
        );
      })}
    </div>
  );
}

// 04 — agent splits into two actions
function ActVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="px-4 py-2 rounded-full text-[12px] font-black font-mono"
        style={{ backgroundColor: T.bg2, border: `2px solid ${T.amber}`, color: T.text1 }}
      >
        AGENT DECIDES
      </div>
      <div className="flex gap-3">
        <motion.div className="w-[2px] h-10" style={{ backgroundColor: T.cyan }}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 }} />
        <motion.div className="w-[2px] h-10" style={{ backgroundColor: T.red }}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 }} />
      </div>
      <div className="flex gap-4">
        <motion.div
          className="w-[170px] rounded-2xl p-4"
          style={{ backgroundColor: T.bg2, border: `1px solid ${T.cyan}55` }}
          initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
        >
          <div className="text-[11px] font-mono mb-1" style={{ color: T.cyan }}>→ DRIVER</div>
          <div className="text-[13px] font-semibold leading-snug" style={{ color: T.text1 }}>
            “Bay 314-09 is free, 2 min walk. Navigate?”
          </div>
        </motion.div>
        <motion.div
          className="w-[170px] rounded-2xl p-4"
          style={{ backgroundColor: T.bg2, border: `1px solid ${T.red}55` }}
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
        >
          <div className="text-[11px] font-mono mb-1" style={{ color: T.red }}>→ PATROL</div>
          <div className="text-[13px] font-semibold leading-snug" style={{ color: T.text1 }}>
            “Unpaid 34 min at 312-05 — routed, ANPR ready.”
          </div>
        </motion.div>
      </div>
    </div>
  );
}
