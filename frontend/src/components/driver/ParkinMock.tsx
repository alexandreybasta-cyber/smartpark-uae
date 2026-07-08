'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

type ViewState = 'select' | 'active' | 'complete';

export default function ParkinMock() {
  const searchParams = useSearchParams();
  const spot = searchParams.get('spot') || '314-08';

  const [view, setView] = useState<ViewState>('select');
  const [duration, setDuration] = useState(1);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const cost = duration * 3;
  const totalSeconds = duration * 60; // accelerated: 1hr = 60s for demo

  // Start parking session
  const startParking = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    setElapsedMinutes(0);
    setView('active');
  }, [totalSeconds]);

  // Countdown timer
  useEffect(() => {
    if (view !== 'active') return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setView('complete');
          return 0;
        }
        return prev - 1;
      });
      setElapsedMinutes((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [view]);

  const endParking = () => {
    setView('complete');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  // --- SELECT VIEW ---
  if (view === 'select') {
    return (
      <div className="flex flex-col gap-5 px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sp-text-1">Payment</h1>
            <p className="text-[10px] text-sp-text-3">Digital Parking Payment</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-200">
            SpotSense Integration
          </div>
        </div>

        {/* Spot Info Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-sp-text-1">Spot {spot}</p>
              <p className="text-sm text-sp-text-3">Street 2C — Dubai Internet City</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
              Available ✓
            </span>
          </div>
          <div className="flex gap-4 text-xs text-sp-text-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sp-blue" />
              Zone B — AED 3/hour
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sp-cyan" />
              50m from you
            </span>
          </div>
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
              🚗
            </div>
            <div>
              <p className="text-sm font-medium text-sp-text-1">Vehicle: •••• 4523</p>
              <p className="text-xs text-sp-text-3">Dubai</p>
            </div>
          </div>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-sp-text-3">
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Duration Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50">
          <p className="text-sm font-medium text-sp-text-2 mb-3">Duration</p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setDuration(hrs)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition ${
                  duration === hrs
                    ? 'bg-sp-cyan text-white shadow-md'
                    : 'bg-emerald-50 text-sp-text-2 hover:bg-emerald-100'
                }`}
              >
                {hrs === 4 ? 'Max' : `${hrs}hr`}
              </button>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-2xl font-bold text-sp-text-1">AED {cost.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={startParking}
          className="w-full py-4 rounded-full bg-emerald-500 text-white font-bold text-base shadow-lg hover:bg-emerald-600 transition active:scale-[0.98]"
        >
          Start Parking — AED {cost.toFixed(2)}
        </button>

        {/* Footer */}
        <p className="text-center text-[10px] text-sp-text-3">
          This is a demo placeholder for future payment integration
        </p>
      </div>
    );
  }

  // --- ACTIVE VIEW ---
  if (view === 'active') {
    return (
      <div className="flex flex-col items-center gap-5 px-4 py-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs text-sp-text-3 uppercase tracking-wide">Active Session</p>
          <p className="text-sm font-medium text-sp-text-2 mt-1">Spot {spot} · Zone B</p>
        </div>

        {/* Circular Progress */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="#d1fae5" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="#00e5a0"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={`${2 * Math.PI * 85 * (1 - progressPercent / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-sp-text-1 font-mono">
              {formatTime(remainingSeconds)}
            </p>
            <p className="text-xs text-sp-text-3 mt-1">remaining</p>
          </div>
        </div>

        {/* Spot Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 w-full">
          <div className="flex items-center justify-between text-sm">
            <span className="text-sp-text-3">Location</span>
            <span className="font-medium text-sp-text-1">Street 2C — DIC</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-sp-text-3">Cost</span>
            <span className="font-medium text-sp-text-1">AED {cost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-sp-text-3">Duration</span>
            <span className="font-medium text-sp-text-1">{duration}hr</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button className="flex-1 py-3 rounded-full bg-amber-50 text-amber-700 font-semibold text-sm border border-amber-200 hover:bg-amber-100 transition">
            Extend Time
          </button>
          <button
            onClick={endParking}
            className="flex-1 py-3 rounded-full bg-white text-red-500 font-semibold text-sm border border-red-200 hover:bg-red-50 transition"
          >
            End Parking
          </button>
        </div>

        <p className="text-center text-[10px] text-sp-text-3">
          This is a demo placeholder for future payment integration
        </p>
      </div>
    );
  }

  // --- COMPLETE VIEW ---
  return (
    <div className="flex flex-col items-center gap-5 px-4 py-8">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-sp-text-1">Session Complete</h2>
        <p className="text-sm text-sp-text-3 mt-1">Thank you for using SpotSense</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-50 w-full">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-sp-text-3">Spot</span>
            <span className="font-medium text-sp-text-1">{spot}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sp-text-3">Duration</span>
            <span className="font-medium text-sp-text-1">{elapsedMinutes} minutes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sp-text-3">Charged</span>
            <span className="font-medium text-sp-text-1">AED {cost.toFixed(2)}</span>
          </div>
          <div className="border-t border-emerald-50 pt-3 flex justify-between text-sm">
            <span className="text-sp-text-3">Status</span>
            <span className="font-medium text-emerald-600">✓ Completed</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setView('select')}
        className="w-full py-3.5 rounded-full bg-sp-cyan text-white font-semibold text-sm shadow-md hover:brightness-110 transition"
      >
        Park Again
      </button>

      <p className="text-center text-[10px] text-sp-text-3">
        This is a demo placeholder for future payment integration
      </p>
    </div>
  );
}
