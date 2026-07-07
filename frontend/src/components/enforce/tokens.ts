// Website tokens — matched to the native iOS app's branding
// (ios/SmartPark/SmartPark/Utils/DesignTokens.swift): white surfaces,
// orange #F97316 primary, green/red/amber spot-status colors.
// Key names are historical (from the dark theme) — values are canonical:
//   cyan  -> brand orange (primary accent, CTAs)
//   purple-> deep orange (AI/agent accent, app gradient end)
export const T = {
  bg0: '#ffffff', // page
  bg1: '#f8fafc', // surface (app surfaceBackground)
  bg2: '#ffffff', // cards
  bg3: '#f1f5f9', // inset fills
  cyan: '#f97316', // PRIMARY — app orange
  blue: '#3b82f6',
  amber: '#f59e0b', // reserved / warning
  red: '#ef4444', // occupied / violation
  purple: '#ea580c', // AI accent — app orange gradient end
  green: '#22c55e', // free spot (app spotFree)
  text1: '#1e293b',
  text2: '#64748b',
  text3: '#94a3b8',
  border: '#e2e8f0', // app borderLight
} as const;
