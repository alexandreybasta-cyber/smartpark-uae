'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Spot } from '@/types';
import { getTargetOccupancy, simulateTick } from '@/lib/simulator';

export function useSimulator(initialSpots: Spot[], speed: number = 1) {
  const [spots, setSpots] = useState<Spot[]>(initialSpots);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(speed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    stop();
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      // Dubai is UTC+4
      const dubaiHour = (new Date().getUTCHours() + 4) % 24;
      const target = getTargetOccupancy(dubaiHour);

      setSpots(prev => simulateTick(prev, target));
    }, 2000 / currentSpeed);
  }, [currentSpeed, stop]);

  const setSpeed = useCallback((newSpeed: number) => {
    setCurrentSpeed(newSpeed);
  }, []);

  // Restart interval when speed changes while running
  useEffect(() => {
    if (isRunning) {
      start();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { spots, isRunning, start, stop, setSpeed, setSpots };
}
