'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const ParkingMap = dynamic(() => import('@/components/map/ParkingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-sp-bg-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sp-cyan border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-sp-text-2">Loading map…</span>
      </div>
    </div>
  ),
});

export default function DemoPage() {
  return (
    <div className="relative w-full h-screen bg-sp-bg-0">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-[900] flex items-center gap-2 px-3 py-2 bg-sp-bg-2/90 backdrop-blur-md border border-white/10 rounded-xl text-sm text-sp-text-2 hover:text-sp-text-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Map */}
      <ParkingMap />
    </div>
  );
}
