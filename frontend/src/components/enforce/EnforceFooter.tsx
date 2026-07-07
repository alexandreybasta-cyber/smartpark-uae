'use client';

import { T } from './tokens';

export default function EnforceFooter() {
  return (
    <footer
      className="py-14 px-6 text-center"
      style={{ backgroundColor: T.bg0, borderTop: `1px solid ${T.border}` }}
    >
      <div className="flex items-baseline justify-center gap-2 mb-3">
        <span className="text-[16px] font-black" style={{ color: T.text1 }}>
          SpotSense
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.2em] px-1.5 py-0.5 rounded"
          style={{ color: T.bg0, backgroundColor: T.cyan }}
        >
          ENFORCE
        </span>
      </div>
      <p className="text-[13px] mb-1" style={{ color: T.text2 }}>
        Automated parking compliance for RTA &amp; Dubai Police — sensors, Parkin payment sync, agentic patrol dispatch.
      </p>
      <p className="text-[12px]" style={{ color: T.text3 }}>
        Built for the Qwen Cloud Challenge · EdgeAgent Track 2026 · Alibaba Cloud + Qwen-Max
      </p>
    </footer>
  );
}
