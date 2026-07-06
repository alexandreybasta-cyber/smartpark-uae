'use client';

import { useVoiceContext } from './VoiceProvider';

export default function VoiceButton() {
  const { openOverlay, isOverlayOpen } = useVoiceContext();

  if (isOverlayOpen) return null;

  return (
    <button
      onClick={openOverlay}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-sp-cyan to-sp-blue flex items-center justify-center shadow-lg shadow-sp-cyan/20 hover:shadow-sp-cyan/40 transition-shadow group"
      aria-label="Open voice assistant"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-sp-cyan to-sp-blue animate-pulse-glow opacity-40" />

      {/* Mic icon */}
      <svg
        className="w-6 h-6 text-white relative z-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 10v2a7 7 0 0 1-14 0v-2"
        />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
