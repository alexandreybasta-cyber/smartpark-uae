'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import NavigationView from '@/components/driver/NavigationView';

function NavigateContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-sp-bg-0 flex flex-col max-w-md mx-auto">
      {/* Status bar mockup */}
      <div className="bg-white px-5 py-2 flex items-center justify-between text-xs text-sp-text-3">
        <span className="font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      {/* Back to driver */}
      <div className="px-4 py-2 bg-white border-b border-emerald-50">
        <button
          onClick={() => router.push('/driver')}
          className="flex items-center gap-1 text-sm text-sp-text-3 hover:text-sp-text-1 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exit Navigation
        </button>
      </div>

      {/* Navigation View */}
      <NavigationView />
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sp-bg-0 flex items-center justify-center"><p className="text-sp-text-3">Loading navigation...</p></div>}>
      <NavigateContent />
    </Suspense>
  );
}
