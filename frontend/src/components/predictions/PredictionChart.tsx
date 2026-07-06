'use client';

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Time-of-day occupancy profile (matches simulator.ts)
function getBaseOccupancy(hour: number): number {
  if (hour >= 0 && hour < 6) return 0.08 + Math.random() * 0.07;
  if (hour >= 6 && hour < 7) return 0.15 + Math.random() * 0.15;
  if (hour >= 7 && hour < 10) return 0.45 + Math.random() * 0.40;
  if (hour >= 10 && hour < 12) return 0.70 + Math.random() * 0.10;
  if (hour >= 12 && hour < 13) return 0.60 + Math.random() * 0.10;
  if (hour >= 13 && hour < 17) return 0.72 + Math.random() * 0.10;
  if (hour >= 17 && hour < 20) return 0.85 + Math.random() * 0.07;
  if (hour >= 20 && hour < 24) return 0.30 + Math.random() * 0.20;
  return 0.5;
}

// Smooth interpolation between hours for 15-min intervals
function getSmoothedOccupancy(hour: number, minute: number, seed: number): number {
  const t = hour + minute / 60;
  const baseHour = Math.floor(t);
  const nextHour = (baseHour + 1) % 24;
  const frac = t - baseHour;

  // Seeded pseudo-random for consistency
  const noise = (Math.sin(seed * 12.9898 + t * 78.233) * 43758.5453) % 1;
  const smallNoise = (noise - 0.5) * 0.06; // ±3%

  const base = getBaseOccupancy(baseHour);
  const next = getBaseOccupancy(nextHour);
  const smoothed = base * (1 - frac) + next * frac;

  return Math.max(0, Math.min(1, smoothed + smallNoise));
}

interface PredictionData {
  timestamps: string[];
  actual: (number | null)[];
  predicted: number[];
}

function generatePredictions(zoneId: number): PredictionData {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentQuarter = Math.floor(currentMinute / 15);

  const timestamps: string[] = [];
  const actual: (number | null)[] = [];
  const predicted: number[] = [];

  // Generate 48 data points (15-min intervals over 12 hours)
  // Start 3 hours in the past, extend 9 hours into the future
  const startTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  for (let i = 0; i < 48; i++) {
    const pointTime = new Date(startTime.getTime() + i * 15 * 60 * 1000);
    const h = pointTime.getHours();
    const m = pointTime.getMinutes();

    timestamps.push(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    );

    const occupancy = getSmoothedOccupancy(h, m, zoneId + i * 0.1) * 100;
    const isPast = pointTime.getTime() <= now.getTime();

    if (isPast) {
      actual.push(Math.round(occupancy * 10) / 10);
    } else {
      actual.push(null);
    }

    predicted.push(Math.round(occupancy * 10) / 10);
  }

  return { timestamps, actual, predicted };
}

interface PredictionChartProps {
  zoneId?: number;
  className?: string;
}

export default function PredictionChart({ zoneId = 312, className = '' }: PredictionChartProps) {
  const data = useMemo(() => generatePredictions(zoneId), [zoneId]);

  const chartData = {
    labels: data.timestamps,
    datasets: [
      {
        label: 'Actual',
        data: data.actual,
        borderColor: '#00e5a0',
        backgroundColor: 'rgba(0, 229, 160, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: true,
        spanGaps: false,
      },
      {
        label: 'Predicted',
        data: data.predicted,
        borderColor: '#a855f7',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'line',
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#0f1629',
        borderColor: '#151d33',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const val = ctx.parsed.y;
            if (val === null) return '';
            return `${ctx.dataset.label}: ${val.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(21, 29, 51, 0.8)' },
        ticks: {
          color: '#64748b',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
          font: { size: 11 },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(21, 29, 51, 0.8)' },
        ticks: {
          color: '#64748b',
          callback: (value: number | string) => `${value}%`,
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className={`bg-sp-bg-2 rounded-2xl p-6 border border-sp-bg-3 ${className}`}>
      <div className="h-64 sm:h-72">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
