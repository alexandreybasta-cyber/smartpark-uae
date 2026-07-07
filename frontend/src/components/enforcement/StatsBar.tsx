'use client';

interface StatCardProps {
  label: string;
  value: string;
  accent: string;
  borderColor: string;
}

function StatCard({ label, value, accent, borderColor }: StatCardProps) {
  return (
    <div className={`bg-sp-bg-2 rounded-xl shadow-sm border-l-4 ${borderColor} p-4 flex flex-col gap-1`}>
      <span className="text-xs font-medium text-sp-text-3 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
    </div>
  );
}

interface StatsBarProps {
  violationsToday: number;
  revenueProtected: number;
  complianceRate: number;
  activeSpots: number;
}

export default function StatsBar({ violationsToday, revenueProtected, complianceRate, activeSpots }: StatsBarProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Violations Today"
          value={String(violationsToday)}
          accent="text-sp-red"
          borderColor="border-sp-red"
        />
        <StatCard
          label="Revenue Protected"
          value={`AED ${revenueProtected.toLocaleString()}`}
          accent="text-emerald-600"
          borderColor="border-sp-cyan"
        />
        <StatCard
          label="Compliance Rate"
          value={`${complianceRate.toFixed(1)}%`}
          accent="text-emerald-600"
          borderColor="border-emerald-400"
        />
        <StatCard
          label="Active Spots Monitored"
          value={String(activeSpots)}
          accent="text-sp-blue"
          borderColor="border-sp-blue"
        />
      </div>
    </div>
  );
}
