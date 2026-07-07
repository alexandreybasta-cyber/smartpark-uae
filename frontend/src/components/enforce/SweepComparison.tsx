'use client';

import { T } from './tokens';
import { useReveal } from './useReveal';

// Left: today's ANPR camera car sweeping every street.
// Right: SpotSense Enforce routing the patrol straight to the flagged bay.
export default function SweepComparison() {
  const { ref, visible } = useReveal<HTMLElement>(0.25);

  return (
    <section
      ref={ref}
      className="py-24 px-6"
      style={{ backgroundColor: T.bg1, borderTop: `1px solid ${T.border}` }}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="text-center transition-all duration-700 mb-14"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <div className="text-[13px] font-bold tracking-[0.25em] mb-3" style={{ color: T.red }}>
            WHY IT MATTERS
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ color: T.text1 }}>
            Stop sweeping. <span style={{ color: T.cyan }}>Start targeting.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* TODAY */}
          <div
            className="rounded-3xl p-7 transition-all duration-700 delay-100"
            style={{
              backgroundColor: T.bg2,
              border: `1px solid ${T.border}`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            <div className="text-[12px] font-bold tracking-[0.2em] mb-2" style={{ color: T.text3 }}>
              TODAY
            </div>
            <h3 className="text-xl font-bold mb-4" style={{ color: T.text1 }}>
              Camera cars sweep every street
            </h3>
            <StreetGrid mode="sweep" animate={visible} />
            <ul className="mt-5 space-y-2 text-[13.5px]" style={{ color: T.text2 }}>
              <li>• Scans thousands of plates to find a handful of violations</li>
              <li>• Coverage limited to where the car happens to drive</li>
              <li>• A violation between passes is simply missed</li>
            </ul>
          </div>

          {/* WITH ENFORCE */}
          <div
            className="rounded-3xl p-7 transition-all duration-700 delay-300"
            style={{
              backgroundColor: T.bg2,
              border: `1px solid ${T.cyan}40`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            <div className="text-[12px] font-bold tracking-[0.2em] mb-2" style={{ color: T.cyan }}>
              WITH SPOTSENSE ENFORCE
            </div>
            <h3 className="text-xl font-bold mb-4" style={{ color: T.text1 }}>
              The patrol drives straight to the violation
            </h3>
            <StreetGrid mode="direct" animate={visible} />
            <ul className="mt-5 space-y-2 text-[13.5px]" style={{ color: T.text2 }}>
              <li>• Every bay self-reports — the sensor is the witness</li>
              <li>• ANPR is used to <em>confirm</em>, not to <em>search</em></li>
              <li>• Fine confirmation syncs back — nothing falls through</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sweep-path { to { stroke-dashoffset: -400; } }
        @keyframes direct-path { from { stroke-dashoffset: 210; } to { stroke-dashoffset: 0; } }
        @keyframes target-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </section>
  );
}

function StreetGrid({ mode, animate }: { mode: 'sweep' | 'direct'; animate: boolean }) {
  const streets = (
    <>
      {/* street grid */}
      {[40, 90, 140].map((y) => (
        <line key={`h${y}`} x1={10} y1={y} x2={310} y2={y} stroke="#e2e8f0" strokeWidth={10} />
      ))}
      {[60, 160, 260].map((x) => (
        <line key={`v${x}`} x1={x} y1={20} x2={x} y2={160} stroke="#e2e8f0" strokeWidth={10} />
      ))}
      {/* parked cars along streets */}
      {[
        [80, 34], [110, 34], [200, 34], [230, 34], [285, 34],
        [80, 84], [140, 84], [185, 84], [280, 84],
        [95, 134], [175, 134], [205, 134], [290, 134],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={16} height={9} rx={2} fill="#cbd5e1" />
      ))}
    </>
  );

  return (
    <svg viewBox="0 0 320 175" className="w-full rounded-xl" style={{ backgroundColor: T.bg0 }}>
      {streets}

      {/* flagged bay (same position in both panels) */}
      <rect
        x={203}
        y={132}
        width={20}
        height={13}
        rx={2}
        fill="none"
        stroke={T.red}
        strokeWidth={2}
        style={{ animation: animate ? 'target-blink 1.6s ease-in-out infinite' : undefined }}
      />

      {mode === 'sweep' ? (
        <>
          {/* zigzag sweep path over every street */}
          <path
            d="M 15 40 H 300 M 300 40 V 90 M 300 90 H 20 M 20 90 V 140 M 20 140 H 300"
            fill="none"
            stroke={T.amber}
            strokeWidth={2.5}
            strokeDasharray="8 8"
            opacity={0.8}
            style={{ animation: animate ? 'sweep-path 6s linear infinite' : undefined }}
          />
          <circle cx={15} cy={40} r={6} fill={T.amber} />
          <text x={15} y={26} fontSize={9} fill={T.text3} textAnchor="start" fontFamily="monospace">
            ANPR car · scans everything
          </text>
        </>
      ) : (
        <>
          {/* direct route to the flagged bay */}
          <path
            d="M 15 40 H 160 V 140 H 200"
            fill="none"
            stroke={T.cyan}
            strokeWidth={3}
            strokeDasharray="210"
            strokeDashoffset={animate ? undefined : 210}
            style={{ animation: animate ? 'direct-path 2.2s ease-out forwards' : undefined }}
          />
          <circle cx={15} cy={40} r={6} fill={T.cyan} />
          <text x={15} y={26} fontSize={9} fill={T.text3} textAnchor="start" fontFamily="monospace">
            patrol · routed by the agent
          </text>
          <text x={228} y={128} fontSize={9} fill={T.red} textAnchor="start" fontFamily="monospace">
            unpaid 22 min
          </text>
        </>
      )}
    </svg>
  );
}
