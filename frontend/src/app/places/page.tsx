'use client';

import Link from 'next/link';
import { PlacesProvider, PlacesList } from '@/components/places';

export default function PlacesPage() {
  return (
    <PlacesProvider>
      <div className="min-h-screen bg-sp-bg-0 text-sp-text-1">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-sp-bg-0/80 backdrop-blur-xl border-b border-sp-bg-3">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href="/demo"
              className="p-2 rounded-lg hover:bg-sp-bg-2 transition-colors text-sp-text-2 hover:text-sp-text-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold">Your Places</h1>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          <PlacesList />
        </main>
      </div>
    </PlacesProvider>
  );
}
