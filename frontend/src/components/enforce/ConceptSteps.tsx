'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { T } from './tokens';
import { useReveal } from './useReveal';

const STEPS = [
  {
    title: 'A car parks in the bay',
    desc: 'The light-powered ToF sensor inside the painted bay detects the vehicle the moment it stops. One bay, one sensor — no cameras needed at this stage.',
    tag: 'DETECT',
    color: T.blue,
  },
  {
    title: 'Payment is checked automatically',
    desc: 'The platform matches the occupied bay against operator / RTA payment records in real time. A paid session ends the story here — nothing is flagged.',
    tag: 'VERIFY',
    color: T.purple,
  },
  {
    title: 'Grace period runs',
    desc: 'A configurable timer (e.g. 10 minutes) gives the driver time to pay. Most drivers pay within minutes — the system stays silent.',
    tag: 'WAIT',
    color: T.amber,
  },
  {
    title: 'Violation flagged to the authority',
    desc: 'No payment when the timer expires? The bay is flagged and a trigger — bay ID, GPS, occupancy time — is pushed to the authority platform instantly.',
    tag: 'FLAG',
    color: T.red,
  },
  {
    title: 'Patrol goes straight to the car',
    desc: 'The nearest ANPR patrol is routed directly to the flagged bay. The camera confirms the plate, the existing RTA fine system issues the fine — and the confirmation syncs back to close the loop.',
    tag: 'ENFORCE',
    color: T.cyan,
  },
];

const STEP_MS = 4200;

export default function ConceptSteps() {
  const { ref, visible } = useReveal<HTMLElement>(0.25);
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restartTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
  }, []);

  useEffect(() => {
    if (!visible) return;
    restartTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, restartTimer]);

  const select = (i: number) => {
    setStep(i);
    restartTimer();
  };

  return (
    <section
      id="concept"
      ref={ref}
      className="py-28 px-6"
      style={{ backgroundColor: T.bg0, borderTop: `1px solid ${T.border}` }}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <div className="text-[13px] font-bold tracking-[0.25em] mb-3" style={{ color: T.cyan }}>
            USE CASE 02 · THE ENFORCEMENT FLOW
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ color: T.text1 }}>
            From parked to fined —{' '}
            <span style={{ color: T.text3 }}>in five automatic steps</span>
          </h2>
          <p className="max-w-[560px] mb-14 text-[15px] leading-relaxed" style={{ color: T.text2 }}>
            Today, camera cars sweep every street hoping to catch violations. SpotSense Enforce
            inverts that: the bay itself reports the violation, and enforcement drives straight to it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Steps list */}
          <div className="flex flex-col gap-3">
            {STEPS.map((s, i) => {
              const active = i === step;
              return (
                <button
                  key={s.tag}
                  onClick={() => select(i)}
                  className="text-left rounded-2xl px-5 py-4 transition-all duration-500 cursor-pointer"
                  style={{
                    backgroundColor: active ? T.bg2 : 'transparent',
                    border: `1px solid ${active ? s.color + '55' : T.border}`,
                    opacity: active ? 1 : 0.55,
                    transform: active ? 'translateX(6px)' : 'translateX(0)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-black transition-colors duration-500"
                      style={{
                        backgroundColor: active ? s.color : T.bg3,
                        color: active ? T.bg0 : T.text3,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.2em]" style={{ color: s.color }}>
                      {s.tag}
                    </span>
                    <span className="text-[16px] font-bold" style={{ color: T.text1 }}>
                      {s.title}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden transition-all duration-500 pl-10"
                    style={{ maxHeight: active ? 120 : 0, opacity: active ? 1 : 0 }}
                  >
                    <p className="text-[13.5px] leading-relaxed" style={{ color: T.text2 }}>
                      {s.desc}
                    </p>
                  </div>
                  {/* progress bar for active step */}
                  {active && (
                    <div className="mt-3 ml-10 h-[3px] rounded overflow-hidden" style={{ backgroundColor: T.bg3 }}>
                      <div
                        key={step}
                        className="h-full rounded"
                        style={{
                          backgroundColor: s.color,
                          animation: `enforce-progress ${STEP_MS}ms linear forwards`,
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Animated bay scene */}
          <BayScene step={step} />
        </div>
      </div>

      <style>{`
        @keyframes enforce-progress { from { width: 0%; } to { width: 100%; } }
        @keyframes enforce-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.6); } }
        @keyframes enforce-dash { to { stroke-dashoffset: -24; } }
      `}</style>
    </section>
  );
}

// The visual stage on the right: a parking bay whose layers fade in/out per step.
function BayScene({ step }: { step: number }) {
  const layer = (from: number, to = 99): React.CSSProperties => ({
    opacity: step >= from && step <= to ? 1 : 0,
    transition: 'opacity 0.7s ease, transform 0.7s ease',
  });

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-8 min-h-[440px] flex items-center justify-center"
      style={{ backgroundColor: T.bg1, border: `1px solid ${T.border}` }}
    >
      {/* street texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px)`,
          backgroundSize: '100% 44px',
          opacity: 0.4,
        }}
      />

      <div className="relative w-full max-w-[400px]">
        {/* Painted bay */}
        <div
          className="relative mx-auto w-[260px] h-[130px] rounded-lg transition-colors duration-700"
          style={{
            border: `2px dashed ${step >= 3 ? T.red : '#cbd5e1'}`,
            backgroundColor: step >= 3 ? 'rgba(239,68,68,0.07)' : '#f8fafc',
          }}
        >
          {/* Sensor */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="relative">
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: T.cyan }} />
              {step >= 0 && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: T.cyan, animation: 'enforce-pulse 2s ease-in-out infinite' }}
                />
              )}
            </div>
            <span className="text-[10px] mt-1 font-mono" style={{ color: T.text3 }}>
              sensor
            </span>
          </div>

          {/* Car — slides in at step 0 */}
          <div
            className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-[62px] rounded-xl flex items-center justify-center"
            style={{
              ...layer(0),
              transform: `translateY(-50%) translateX(${step >= 0 ? 0 : 120}px)`,
              backgroundColor: '#e2e8f0',
              border: `1px solid #cbd5e1`,
            }}
          >
            <div className="px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-widest"
              style={{ backgroundColor: T.text1, color: T.bg0, ...layer(4) }}>
              D 12345
            </div>
            {/* windows */}
            <div className="absolute left-4 top-2 w-8 h-2.5 rounded-sm" style={{ backgroundColor: '#cbd5e1' }} />
            <div className="absolute right-4 top-2 w-8 h-2.5 rounded-sm" style={{ backgroundColor: '#cbd5e1' }} />
          </div>
        </div>

        {/* Step 2: payment check chip */}
        <div className="flex justify-center mt-5" style={layer(1)}>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold"
            style={{
              backgroundColor: T.bg2,
              border: `1px solid ${step >= 2 ? T.amber + '66' : T.purple + '66'}`,
              color: T.text2,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: step >= 2 ? T.red : T.purple }}
            />
            Operator / RTA check:&nbsp;
            <span style={{ color: T.red, opacity: step >= 1 ? 1 : 0 }} className="font-bold">
              no active session
            </span>
          </div>
        </div>

        {/* Step 3: grace timer */}
        <div className="flex justify-center mt-4" style={layer(2)}>
          <GraceTimer active={step === 2} expired={step >= 3} />
        </div>

        {/* Step 4: violation alert */}
        <div className="flex justify-center mt-4" style={layer(3)}>
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-bold"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: `1px solid ${T.red}55`, color: T.red }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: T.red, animation: 'enforce-pulse 1.2s ease-in-out infinite' }} />
            VIOLATION · Bay 314-09 → pushed to authority platform
          </div>
        </div>

        {/* Step 5: enforcement result */}
        <div className="flex flex-col items-center gap-2 mt-4" style={layer(4)}>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold"
            style={{ backgroundColor: T.bg2, border: `1px solid ${T.blue}55`, color: T.text2 }}
          >
            🚓 Patrol P-07 routed · ANPR confirms <span className="font-mono font-bold" style={{ color: T.text1 }}>D 12345</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-bold"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: `1px solid ${T.green}55`, color: T.green }}
          >
            ✓ Fine AED 150 issued — confirmation synced from RTA
          </div>
        </div>
      </div>
    </div>
  );
}

function GraceTimer({ active, expired }: { active: boolean; expired: boolean }) {
  const [seconds, setSeconds] = useState(600);

  useEffect(() => {
    if (!active) {
      setSeconds(600);
      return;
    }
    const iv = setInterval(() => setSeconds((s) => Math.max(0, s - 37)), 250);
    return () => clearInterval(iv);
  }, [active]);

  const shown = expired ? 0 : seconds;
  const mm = String(Math.floor(shown / 60)).padStart(2, '0');
  const ss = String(shown % 60).padStart(2, '0');

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-full"
      style={{ backgroundColor: T.bg2, border: `1px solid ${expired ? T.red + '66' : T.amber + '66'}` }}
    >
      <span className="text-[12px] font-semibold" style={{ color: T.text3 }}>
        grace period
      </span>
      <span
        className="font-mono text-[16px] font-bold tabular-nums"
        style={{ color: expired ? T.red : T.amber }}
      >
        {mm}:{ss}
      </span>
      <span className="text-[12px] font-semibold" style={{ color: expired ? T.red : T.text3 }}>
        {expired ? 'expired' : 'awaiting payment…'}
      </span>
    </div>
  );
}
