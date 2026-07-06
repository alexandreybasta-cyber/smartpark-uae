'use client';

import PredictionChart from './PredictionChart';
import ZoneComparison from './ZoneComparison';

interface PredictionPanelProps {
  className?: string;
}

export default function PredictionPanel({ className = '' }: PredictionPanelProps) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-sp-text-1">Occupancy Forecast</h2>
        <p className="text-sp-text-2 text-sm mt-1">
          12-hour prediction based on historical patterns
        </p>
      </div>

      {/* Chart section */}
      <PredictionChart className="mb-6" />

      {/* Separator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-sp-bg-3" />
        <span className="text-xs text-sp-text-3 font-medium uppercase tracking-wider">
          Zone Comparison
        </span>
        <div className="flex-1 h-px bg-sp-bg-3" />
      </div>

      {/* Zone comparison */}
      <ZoneComparison />
    </div>
  );
}
