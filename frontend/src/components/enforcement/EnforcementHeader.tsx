'use client';

import Link from 'next/link';

export default function EnforcementHeader() {
  return (
    <header className="bg-sp-bg-2 border-b border-sp-bg-3 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sp-text-3 hover:text-sp-text-1 transition-colors text-sm flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="h-6 w-px bg-sp-bg-3" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sp-cyan/15 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-sp-cyan)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-sp-text-1">SpotSense Enforcement</h1>
              <p className="text-xs text-sp-text-3">Automated Parking Violation Detection</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-700 tracking-wide">LIVE</span>
        </div>
      </div>
    </header>
  );
}
