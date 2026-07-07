'use client';

import { useEffect, useRef, useState } from 'react';
import { T } from './tokens';
import { useReveal } from './useReveal';

type Line =
  | { kind: 'alert'; text: string }
  | { kind: 'officer'; text: string }
  | { kind: 'reasoning'; steps: string[] }
  | { kind: 'agent'; text: string }
  | { kind: 'confirm'; text: string };

// Scripted patrol-agent conversation, revealed line by line when scrolled
// into view. Mirrors the intents the real backend agent will serve
// (nearby violations, fine status lookups, proactive alerts).
const SCRIPT: Line[] = [
  { kind: 'alert', text: 'NEW VIOLATION — Bay 314-09 · Street 2C, DIC · unpaid for 12 min' },
  { kind: 'officer', text: 'Any unpaid vehicles on my route?' },
  {
    kind: 'reasoning',
    steps: [
      'Locating patrol P-07 → Street 2A, heading east',
      'Querying flagged bays within 800m…',
      '3 active violations found',
      'Ranking by unpaid duration + detour distance',
    ],
  },
  {
    kind: 'agent',
    text: '3 active violations near you. Closest: Bay 314-09 on Street 2C — occupied 34 min, no Parkin session. 240m ahead on your right. The other two are queued on your return loop.',
  },
  { kind: 'officer', text: 'Was a fine signaled for bay 312-05?' },
  {
    kind: 'agent',
    text: 'Yes — AED 150 issued at 14:32, ref DXB-4F7C21, synced back from the RTA fine system. The vehicle is still in the bay: tow eligibility in 26 minutes.',
  },
  { kind: 'confirm', text: '✓ Fine DXB-4F7C21 confirmed · loop closed' },
];

const LINE_DELAY = 1400;
const STEP_DELAY = 650;

export default function AgentPoliceDemo() {
  const { ref, visible } = useReveal<HTMLElement>(0.35);
  const [shownLines, setShownLines] = useState(0);
  const [shownSteps, setShownSteps] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Reveal lines one by one; reasoning blocks reveal their steps first.
  useEffect(() => {
    if (!visible) return;
    if (shownLines >= SCRIPT.length) {
      // loop the demo after a pause
      const t = setTimeout(() => {
        setShownLines(0);
        setShownSteps(0);
      }, 6000);
      return () => clearTimeout(t);
    }

    const current = SCRIPT[shownLines];
    if (current?.kind === 'reasoning' && shownSteps < current.steps.length) {
      const t = setTimeout(() => setShownSteps((s) => s + 1), STEP_DELAY);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setShownLines((n) => n + 1);
      setShownSteps(0);
    }, LINE_DELAY);
    return () => clearTimeout(t);
  }, [visible, shownLines, shownSteps]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [shownLines, shownSteps]);

  return (
    <section
      id="agent"
      ref={ref}
      className="py-28 px-6"
      style={{ backgroundColor: T.bg0, borderTop: `1px solid ${T.border}` }}
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        {/* Copy */}
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <div className="text-[13px] font-bold tracking-[0.25em] mb-3" style={{ color: T.purple }}>
            AGENTIC LAYER
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5" style={{ color: T.text1 }}>
            An agent riding along <span style={{ color: T.purple }}>with every patrol</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-6" style={{ color: T.text2 }}>
            Officers don&apos;t browse dashboards while driving. They ask. The Qwen-powered agent
            knows every flagged bay, every patrol position, and every fine confirmation coming back
            from the RTA system — and answers by voice, in Arabic or English.
          </p>
          <ul className="space-y-3 text-[14px]" style={{ color: T.text2 }}>
            <li className="flex gap-3">
              <span style={{ color: T.purple }}>▸</span>
              <span><strong style={{ color: T.text1 }}>&ldquo;Any unpaid vehicles on my route?&rdquo;</strong> — ranked by unpaid duration and detour distance</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: T.purple }}>▸</span>
              <span><strong style={{ color: T.text1 }}>&ldquo;Was a fine signaled for bay 312-05?&rdquo;</strong> — live status from the fine-confirmation sync</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: T.purple }}>▸</span>
              <span><strong style={{ color: T.text1 }}>Proactive alerts</strong> — new violations assigned to the nearest unit, automatically</span>
            </li>
          </ul>
        </div>

        {/* Chat panel */}
        <div
          className="rounded-3xl overflow-hidden transition-all duration-700 delay-200"
          style={{
            backgroundColor: T.bg1,
            border: `1px solid ${T.border}`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ backgroundColor: T.bg2, borderBottom: `1px solid ${T.border}` }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: T.cyan }} />
              <span className="text-[13px] font-bold" style={{ color: T.text1 }}>
                Patrol P-07 · Enforce Agent
              </span>
            </div>
            <span className="text-[11px] font-mono" style={{ color: T.text3 }}>
              DIC sector · live
            </span>
          </div>

          <div ref={scrollRef} className="h-[420px] overflow-y-auto px-5 py-5 flex flex-col gap-3">
            {SCRIPT.slice(0, shownLines + 1).map((line, i) => {
              const isCurrent = i === shownLines;
              return (
                <ChatLine
                  key={i}
                  line={line}
                  shownSteps={line.kind === 'reasoning' ? (isCurrent ? shownSteps : line.steps.length) : 0}
                />
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes enforce-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}

function ChatLine({ line, shownSteps }: { line: Line; shownSteps: number }) {
  const base = 'animate-[enforce-fadein_0.5s_ease-out]';

  if (line.kind === 'alert' || line.kind === 'confirm') {
    const isAlert = line.kind === 'alert';
    const color = isAlert ? T.red : T.cyan;
    return (
      <div
        className={`self-center text-center px-4 py-2 rounded-full text-[12px] font-bold ${base}`}
        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}55`, color }}
      >
        {line.text}
      </div>
    );
  }

  if (line.kind === 'officer') {
    return (
      <div
        className={`self-end max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md text-[14px] ${base}`}
        style={{ backgroundColor: T.blue, color: '#fff' }}
      >
        🎙 {line.text}
      </div>
    );
  }

  if (line.kind === 'reasoning') {
    if (shownSteps === 0) return null;
    return (
      <div
        className={`self-start max-w-[85%] px-3.5 py-2.5 rounded-xl ${base}`}
        style={{ backgroundColor: T.bg2, borderLeft: `2px solid ${T.purple}` }}
      >
        {line.steps.slice(0, shownSteps).map((s, i) => (
          <div key={i} className="flex gap-2 text-[12px] py-0.5" style={{ color: T.text2 }}>
            <span style={{ color: T.purple }}>✓</span>
            {s}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`self-start max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md text-[14px] leading-relaxed ${base}`}
      style={{ backgroundColor: T.bg3, color: T.text1, border: `1px solid ${T.border}` }}
    >
      {line.text}
    </div>
  );
}
