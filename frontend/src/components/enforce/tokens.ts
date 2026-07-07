// Explicit design tokens for the enforcement page (spec §10 dark theme).
// Deliberately NOT using the shared sp-* Tailwind tokens: those are being
// re-themed in parallel; this page must render identically regardless.
export const T = {
  bg0: '#04060b',
  bg1: '#0a0e1a',
  bg2: '#0f1629',
  bg3: '#151d33',
  cyan: '#00e5a0',
  blue: '#3b82f6',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
  text1: '#f1f5f9',
  text2: '#94a3b8',
  text3: '#64748b',
  border: 'rgba(255,255,255,0.08)',
} as const;
