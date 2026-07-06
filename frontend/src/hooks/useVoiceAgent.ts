'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { processQuery, AgentResult } from '@/lib/agentResponses';
import { savedPlaces } from '@/data/seed';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'responding' | 'error';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export interface UseVoiceAgentReturn {
  state: VoiceState;
  transcript: string;
  response: AgentResult | null;
  reasoningSteps: string[];
  visibleSteps: number;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => void;
  reset: () => void;
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<AgentResult | null>(null);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<unknown>(null);
  const stepsTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const clearStepsTimer = useCallback(() => {
    if (stepsTimerRef.current) {
      clearInterval(stepsTimerRef.current);
      stepsTimerRef.current = null;
    }
  }, []);

  const showReasoningSteps = useCallback(
    (steps: string[], onComplete: () => void) => {
      setReasoningSteps(steps);
      setVisibleSteps(0);
      let current = 0;

      stepsTimerRef.current = setInterval(() => {
        current++;
        setVisibleSteps(current);
        if (current >= steps.length) {
          clearStepsTimer();
          setTimeout(onComplete, 400);
        }
      }, 600);
    },
    [clearStepsTimer]
  );

  const processInput = useCallback(
    (text: string) => {
      setState('processing');
      setTranscript(text);

      // Small delay to simulate processing
      setTimeout(() => {
        const result = processQuery(text, savedPlaces);

        showReasoningSteps(result.reasoningSteps, () => {
          setResponse(result);
          setState('responding');
        });
      }, 500);
    },
    [showReasoningSteps]
  );

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      setState('error');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
        } else if (interimTranscript) {
          setTranscript(interimTranscript);
        }
      };

      recognition.onend = () => {
        if (state === 'listening') {
          const currentTranscript = transcript;
          if (currentTranscript.trim()) {
            processInput(currentTranscript);
          } else {
            setState('idle');
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech') {
          setState('idle');
        } else {
          setError(`Speech recognition error: ${event.error}`);
          setState('error');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setState('listening');
      setTranscript('');
      setError(null);
    } catch (e) {
      setError('Failed to start speech recognition');
      setState('error');
      console.error(e);
    }
  }, [state, transcript, processInput]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop();
    }
    if (transcript.trim()) {
      processInput(transcript);
    } else {
      setState('idle');
    }
  }, [transcript, processInput]);

  const sendText = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      processInput(text.trim());
    },
    [processInput]
  );

  const reset = useCallback(() => {
    clearStepsTimer();
    setState('idle');
    setTranscript('');
    setResponse(null);
    setReasoningSteps([]);
    setVisibleSteps(0);
    setError(null);
    if (recognitionRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop();
    }
  }, [clearStepsTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearStepsTimer();
      if (recognitionRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (recognitionRef.current as any).stop();
      }
    };
  }, [clearStepsTimer]);

  return {
    state,
    transcript,
    response,
    reasoningSteps,
    visibleSteps,
    error,
    isSupported,
    startListening,
    stopListening,
    sendText,
    reset,
  };
}
