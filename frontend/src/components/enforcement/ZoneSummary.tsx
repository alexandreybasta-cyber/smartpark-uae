'use client';

interface ZoneData {
  id: string;
  violations: number;
  compliant: number;
  total: number;
}

interface ZoneSummaryProps {
  zones: ZoneData[];
}

export default function ZoneSummary({ zones }: ZoneSummaryProps) {
  return (
    <div className="bg-sp-bg-2 rounded-xl shadow-sm p-5 mb-6">
      <h2 className="text-sm font-semibold text-sp-text-1 mb-4">Zone Compliance</h2>
      <div className="space-y-4">
        {zones.map((zone) => {
          const rate = (zone.compliant / zone.total) * 100;
          return (
            <div key={zone.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-sp-text-1">Zone {zone.id}</span>
                <span className="text-[10px] text-sp-text-3">
                  {zone.violations} violations · {zone.compliant}/{zone.total} compliant
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rate}%`,
                    background: rate > 90 ? 'var(--color-sp-cyan)' : rate > 75 ? 'var(--color-sp-amber)' : 'var(--color-sp-red)',
                  }}
                />
              </div>
              <p className="text-[10px] text-sp-text-3 mt-0.5 text-right">{rate.toFixed(0)}% compliance</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
