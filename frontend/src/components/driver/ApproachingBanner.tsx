'use client';

import { useRouter } from 'next/navigation';

export default function ApproachingBanner() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-600 text-sm">🅿️</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-sp-text-1">3 spots available</p>
            <p className="text-xs text-sp-text-3">Nearest: 50m from destination</p>
          </div>
        </div>
      </div>

      {/* Mini map preview */}
      <div className="bg-emerald-50 rounded-xl h-20 flex items-center justify-center mb-3 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 200 80">
            <rect x="20" y="20" width="40" height="40" rx="4" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
            <rect x="80" y="10" width="50" height="60" rx="4" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
            <rect x="145" y="25" width="35" height="35" rx="4" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
            <line x1="70" y1="40" x2="80" y2="40" stroke="#9ca3af" strokeWidth="2" />
            <line x1="130" y1="40" x2="145" y2="40" stroke="#9ca3af" strokeWidth="2" />
          </svg>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sp-cyan animate-pulse" />
          <span className="text-xs font-medium text-sp-text-2">Spot 314-08</span>
          <span className="text-[10px] text-sp-text-3">· 50m</span>
        </div>
      </div>

      <button
        onClick={() => router.push('/parkin-mock?spot=314-08')}
        className="w-full py-2.5 rounded-full bg-sp-cyan text-white font-semibold text-sm shadow-md hover:brightness-110 transition active:scale-[0.98]"
      >
        Open Parkin
      </button>
    </div>
  );
}
