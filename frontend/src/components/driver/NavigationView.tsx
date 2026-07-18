'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const destinations: Record<string, { name: string; area: string }> = {
  home: { name: 'Al Barsha Residence', area: 'Al Barsha 1' },
  work: { name: 'Dubai Internet City', area: 'DIC Tower 2' },
  gym: { name: 'Fitness First', area: 'Mall of Emirates' },
  default: { name: 'Dubai Internet City', area: 'Near Building 12' },
};

export default function NavigationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destKey = searchParams.get('destination') || 'work';
  const dest = destinations[destKey] || destinations.default;

  const [progress, setProgress] = useState(0);
  const [distance, setDistance] = useState(2.3);
  const [eta, setEta] = useState(240); // seconds
  const [showNotification, setShowNotification] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  // Simulate journey progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
      setDistance((prev) => Math.max(0, prev - 0.046));
      setEta((prev) => Math.max(0, prev - 5));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Trigger notification after ~4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss notification after 5s
  useEffect(() => {
    if (showNotification && !notificationDismissed) {
      const timer = setTimeout(() => {
        setShowNotification(false);
        setNotificationDismissed(true);
        setShowBadge(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, notificationDismissed]);

  const handleNotificationTap = useCallback(() => {
    router.push('/payment-demo?spot=314-08');
  }, [router]);

  const formatEta = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-60px)] overflow-hidden">
      {/* iOS-style Notification */}
      <div
        className={`absolute top-2 left-3 right-3 z-50 transition-all duration-500 ease-out ${
          showNotification
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={handleNotificationTap}
          className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-emerald-100 p-3.5 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sp-text-2">SpotSense</span>
                <span className="text-[10px] text-sp-text-3">now</span>
              </div>
              <p className="text-sm font-medium text-sp-text-1 mt-0.5">
                🅿️ Spot found near your destination!
              </p>
              <p className="text-xs text-sp-text-3 mt-0.5">
                Spot 314-08 · 50m ahead · Tap to park
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Persistent Badge (after notification dismissal) */}
      {showBadge && (
        <button
          onClick={handleNotificationTap}
          className="absolute top-3 right-3 z-50 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md animate-fade-in flex items-center gap-1.5"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          1 spot found
        </button>
      )}

      {/* Top Bar — Destination */}
      <div className="bg-white border-b border-emerald-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sp-text-1">{dest.name}</p>
          <p className="text-xs text-sp-text-3">{dest.area}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-sp-text-1">{formatEta(eta)}</p>
          <p className="text-[10px] text-sp-text-3 uppercase tracking-wide">ETA</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-emerald-100">
        <div
          className="h-full bg-sp-cyan transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Map Area — Animated Route */}
      <div className="flex-1 bg-gradient-to-b from-emerald-50 to-white relative flex items-center justify-center overflow-hidden">
        {/* Road SVG */}
        <svg viewBox="0 0 300 400" className="w-full h-full max-h-[400px]" preserveAspectRatio="xMidYMid meet">
          {/* Road */}
          <path
            d="M 150 380 C 150 300, 100 250, 120 200 C 140 150, 200 120, 180 80 C 160 40, 150 20, 150 10"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <path
            d="M 150 380 C 150 300, 100 250, 120 200 C 140 150, 200 120, 180 80 C 160 40, 150 20, 150 10"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Dashed center line */}
          <path
            d="M 150 380 C 150 300, 100 250, 120 200 C 140 150, 200 120, 180 80 C 160 40, 150 20, 150 10"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeDasharray="8 6"
          />
          {/* Destination marker */}
          <circle cx="150" cy="14" r="8" fill="#ef4444" />
          <circle cx="150" cy="14" r="4" fill="white" />
          {/* Car dot (moving) */}
          <circle r="7" fill="#00e5a0" className="drop-shadow-md">
            <animateMotion
              dur="10s"
              repeatCount="indefinite"
              path="M 150 380 C 150 300, 100 250, 120 200 C 140 150, 200 120, 180 80 C 160 40, 150 20, 150 10"
            />
          </circle>
          <circle r="12" fill="#00e5a0" opacity="0.2">
            <animateMotion
              dur="10s"
              repeatCount="indefinite"
              path="M 150 380 C 150 300, 100 250, 120 200 C 140 150, 200 120, 180 80 C 160 40, 150 20, 150 10"
            />
          </circle>
        </svg>

        {/* Destination label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm text-xs font-medium text-sp-text-2">
          📍 {dest.name}
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="bg-white border-t border-emerald-100 px-4 py-3 flex items-center justify-between">
        <div className="text-center">
          <p className="text-lg font-bold text-sp-text-1">{distance.toFixed(1)} km</p>
          <p className="text-[10px] text-sp-text-3 uppercase tracking-wide">Distance</p>
        </div>
        <div className="w-px h-8 bg-emerald-100" />
        <div className="text-center">
          <p className="text-lg font-bold text-sp-text-1">{formatEta(eta)}</p>
          <p className="text-[10px] text-sp-text-3 uppercase tracking-wide">ETA</p>
        </div>
        <div className="w-px h-8 bg-emerald-100" />
        <div className="text-center">
          <p className="text-lg font-bold text-sp-cyan">{Math.round(progress)}%</p>
          <p className="text-[10px] text-sp-text-3 uppercase tracking-wide">Progress</p>
        </div>
      </div>
    </div>
  );
}
