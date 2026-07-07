'use client';

export interface Violation {
  id: string;
  spotId: string;
  zone: string;
  timeParked: string;
  durationUnpaid: number; // minutes
  status: 'active' | 'grace' | 'resolved';
}

interface ViolationListProps {
  violations: Violation[];
  onSelectViolation: (v: Violation) => void;
  onAction: (id: string, action: 'fine' | 'dismiss') => void;
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-red-100 text-red-700 border-red-200',
  grace: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function ViolationList({ violations, onSelectViolation, onAction }: ViolationListProps) {
  const sorted = [...violations].sort((a, b) => b.durationUnpaid - a.durationUnpaid);

  return (
    <div className="bg-sp-bg-2 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sp-text-1">Active Violations</h2>
        <span className="text-xs text-sp-text-3">{violations.filter(v => v.status === 'active').length} active</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-sp-text-3">
              <th className="text-left px-4 py-2 font-medium">Spot ID</th>
              <th className="text-left px-4 py-2 font-medium">Zone</th>
              <th className="text-left px-4 py-2 font-medium">Time Parked</th>
              <th className="text-left px-4 py-2 font-medium">Duration Unpaid</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v, idx) => (
              <tr
                key={v.id}
                className="border-b border-gray-50 hover:bg-sp-bg-0/50 cursor-pointer transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => onSelectViolation(v)}
              >
                <td className="px-4 py-2.5 font-mono font-medium text-sp-text-1">{v.spotId}</td>
                <td className="px-4 py-2.5 text-sp-text-3">{v.zone}</td>
                <td className="px-4 py-2.5 text-sp-text-3">{v.timeParked}</td>
                <td className="px-4 py-2.5 font-medium text-sp-text-1">{v.durationUnpaid} min</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[v.status]}`}>
                    {v.status === 'active' ? 'Active' : v.status === 'grace' ? 'Grace Period' : 'Resolved'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {v.status === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAction(v.id, 'fine'); }}
                      className="px-2.5 py-1 bg-red-500 text-white rounded-md text-[10px] font-medium hover:bg-red-600 transition-colors"
                    >
                      Issue Fine
                    </button>
                  )}
                  {v.status === 'grace' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAction(v.id, 'dismiss'); }}
                      className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md text-[10px] font-medium hover:bg-gray-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                  {v.status === 'resolved' && (
                    <span className="text-[10px] text-sp-text-3">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
