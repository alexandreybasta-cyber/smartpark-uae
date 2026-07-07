// SpotSense design tokens — see ARCHITECTURE.md
export const colors = {
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
};

export const statusColors: Record<string, string> = {
  free: colors.cyan,
  occupied: colors.red,
  reserved: colors.amber,
  sensor_offline: colors.text3,
};

export const radius = {
  card: 16,
  input: 10,
  badge: 20,
  small: 6,
};
