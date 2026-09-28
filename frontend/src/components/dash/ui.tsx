'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

export function PageHeader({ title, sub, action }: {
  title: string; sub?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
        {sub ? <p className="text-sm text-zinc-500 mt-0.5">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, accent, children, className = '' }: {
  title?: string; accent?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white border border-zinc-200 rounded-lg shadow-sm ${className}`}
         style={accent ? { borderTop: `3px solid ${accent}` } : undefined}>
      {title ? (
        <div className="px-4 pt-3 pb-2 border-b border-zinc-100 text-sm font-semibold text-zinc-700">
          {title}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint }: {
  label: string; value: ReactNode; hint?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-2xl font-bold text-zinc-900 leading-tight">{value}</div>
      {hint ? <div className="text-xs text-zinc-500 mt-0.5">{hint}</div> : null}
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500 border-b border-zinc-200">
            {head.map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="py-6 text-center text-zinc-400">
              No data yet
            </td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="border-b border-zinc-100 last:border-0">
              {r.map((c, j) => <td key={j} className="py-2 pr-4 text-zinc-700">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ tone, children }: {
  tone: 'green' | 'red' | 'amber' | 'zinc' | 'orange'; children: ReactNode;
}) {
  const tones: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    zinc: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function bayTone(status: string): 'green' | 'red' | 'amber' | 'zinc' {
  if (status === 'free') return 'green';
  if (status === 'occupied') return 'red';
  if (status === 'reserved') return 'amber';
  return 'zinc';
}

export function BackToOverview() {
  return (
    <Link href="/dash" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
      Back to overview
    </Link>
  );
}
