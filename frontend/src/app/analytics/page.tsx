'use client';

import Link from 'next/link';
import { PredictionPanel } from '@/components/predictions';
import { zones } from '@/data/seed';

export default function AnalyticsPage() {
  // Find the best time to park based on time-of-day profiles
  const hour = new Date().getHours();
  let bestTimeText = '';
  if (hour < 7) {
    bestTimeText = 'Now is a great time — streets are nearly empty';
  } else if (hour < 12) {
    bestTimeText = 'Best window: 12:00–13:00 (lunch break dip)';
  } else if (hour < 17) {
    bestTimeText = 'Best window: after 20:00 (evening cool-down)';
  } else if (hour < 20) {
    bestTimeText = 'Peak hours now — consider waiting until 20:00+';
  } else {
    bestTimeText = 'Occupancy dropping — good time to find parking';
  }

  return (
    <div className="min-h-screen bg-sp-bg-0 text-sp-text-1">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-sp-bg-0/80 backdrop-blur-xl border-b border-sp-bg-3">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/demo"
            className="p-2 rounded-lg hover:bg-sp-bg-2 transition-colors text-sp-text-2 hover:text-sp-text-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold">Analytics</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Prediction Panel */}
        <PredictionPanel />

        {/* Best time recommendation */}
        <div className="bg-sp-bg-2 rounded-2xl p-6 border border-sp-bg-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sp-cyan/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-sp-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-sp-text-1 mb-1">Best Time to Park</h3>
              <p className="text-sp-text-2">{bestTimeText}</p>
            </div>
          </div>
        </div>

        {/* Per-zone quick stats */}
        <div>
          <h3 className="text-lg font-semibold text-sp-text-1 mb-4">Zone Details</h3>
          <div className="space-y-3">
            {zones.map(zone => {
              const occupancy = Math.round(((zone.total_spots - zone.free_spots) / zone.total_spots) * 100);
              return (
                <div key={zone.id} className="bg-sp-bg-2 rounded-xl p-4 border border-sp-bg-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sp-text-1 font-medium truncate">{zone.name}</p>
                    <p className="text-sp-text-3 text-sm">
                      AED {zone.price_per_hour}/hr &middot; Type {zone.pricing_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sp-text-1 font-bold">{zone.free_spots} free</p>
                    <p className="text-sp-text-3 text-xs">{occupancy}% occupied</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
