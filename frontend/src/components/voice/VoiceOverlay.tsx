'use client';

import { useEffect, useCallback } from 'react';
import { useVoiceContext } from './VoiceProvider';
import Waveform from './Waveform';
import ReasoningSteps from './ReasoningSteps';
import MapCard from './MapCard';
import SuggestionChips from './SuggestionChips';

export default function VoiceOverlay() {
  const {
    isOverlayOpen,
    closeOverlay,
    state,
    transcript,
    response,
    reasoningSteps,
    visibleSteps,
    isSupported,
    startListening,
    stopListening,
    sendText,
    reset,
    toggleChat,
  } = useVoiceContext();

  // ESC to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeOverlay();
      }
    },
    [closeOverlay]
  );

  useEffect(() => {
    if (isOverlayOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOverlayOpen, handleKeyDown]);

  if (!isOverlayOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-sp-bg-0/95 backdrop-blur-md">
      {/* Close button */}
      <button
        onClick={closeOverlay}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-sp-bg-2 text-sp-text-2 hover:text-sp-text-1 hover:bg-sp-bg-3 transition-colors"
        aria-label="Close overlay"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Toggle chat button */}
      <button
        onClick={toggleChat}
        className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-sp-bg-2 text-sp-text-2 text-xs font-medium hover:text-sp-text-1 hover:bg-sp-bg-3 transition-colors"
      >
        Switch to Chat
      </button>

      {/* Main content area */}
      <div className="flex flex-col items-center gap-6 px-6 max-w-md w-full">
        {/* IDLE state */}
        {state === 'idle' && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sp-cyan to-sp-blue flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <p className="text-sp-text-1 text-lg font-medium">How can I help?</p>
            <p className="text-sp-text-3 text-sm text-center">
              {isSupported
                ? 'Tap the mic to speak, or try a suggestion below'
                : 'Voice not supported — try a suggestion below'}
            </p>

            {isSupported && (
              <button
                onClick={startListening}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-sp-cyan to-sp-blue text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Start Listening
              </button>
            )}

            <SuggestionChips onSelect={sendText} />
          </div>
        )}

        {/* LISTENING state */}
        {state === 'listening' && (
          <div className="flex flex-col items-center gap-6 animate-fade-in" onClick={stopListening}>
            <Waveform isListening={true} />
            <p className="text-sp-cyan text-sm font-medium">Listening...</p>
            {transcript && (
              <p className="text-sp-text-1 text-center text-lg">{transcript}</p>
            )}
            <p className="text-sp-text-3 text-xs">Tap anywhere or press ESC to stop</p>
          </div>
        )}

        {/* PROCESSING state */}
        {state === 'processing' && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-sp-cyan/20 flex items-center justify-center animate-pulse-glow">
              <span className="text-sp-cyan font-bold text-lg">SP</span>
            </div>
            <p className="text-sp-text-2 text-sm font-medium">Thinking...</p>
            {transcript && (
              <p className="text-sp-text-3 text-xs italic">&ldquo;{transcript}&rdquo;</p>
            )}
            <ReasoningSteps steps={reasoningSteps} visibleCount={visibleSteps} />
          </div>
        )}

        {/* RESPONDING state */}
        {state === 'responding' && response && (
          <div className="flex flex-col items-center gap-4 animate-fade-in w-full">
            <div className="w-12 h-12 rounded-full bg-sp-cyan/20 flex items-center justify-center">
              <span className="text-sp-cyan font-bold text-sm">SP</span>
            </div>
            <p className="text-sp-text-1 text-sm text-center whitespace-pre-line leading-relaxed">
              {response.text}
            </p>
            {response.mapCard && <MapCard data={response.mapCard} />}
            <button
              onClick={reset}
              className="mt-4 px-5 py-2 rounded-full bg-sp-bg-2 border border-sp-bg-3 text-sp-text-2 text-xs font-medium hover:border-sp-cyan hover:text-sp-text-1 transition-colors"
            >
              Ask another
            </button>
          </div>
        )}

        {/* ERROR state */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-sp-red/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-sp-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <p className="text-sp-red text-sm">Something went wrong</p>
            <button
              onClick={reset}
              className="px-5 py-2 rounded-full bg-sp-bg-2 border border-sp-bg-3 text-sp-text-2 text-xs font-medium hover:border-sp-cyan transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
