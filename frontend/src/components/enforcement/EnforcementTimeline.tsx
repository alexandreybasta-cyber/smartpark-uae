'use client';

import { useRef, useEffect } from 'react';

export interface TimelineEvent {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'warning' | 'violation' | 'resolved';
}

interface EnforcementTimelineProps {
  events: TimelineEvent[];
}

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-sp-blue',
  warning: 'bg-sp-amber',
  violation: 'bg-sp-red',
  resolved: 'bg-sp-cyan',
};

export default function EnforcementTimeline({ events }: EnforcementTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div className="bg-sp-bg-2 rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-semibold text-sp-text-1 mb-4">Activity Timeline</h2>
      <div ref={containerRef} className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {events.map((event, idx) => (
          <div
            key={event.id}
            className="flex gap-3 items-start animate-fade-in"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TYPE_COLORS[event.type]}`} />
            <div className="min-w-0">
              <span className="text-[10px] text-sp-text-3 font-mono">{event.time}</span>
              <p className="text-xs text-sp-text-1 leading-relaxed">{event.message}</p>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-xs text-sp-text-3 text-center py-4">No events yet</p>
        )}
      </div>
    </div>
  );
}
