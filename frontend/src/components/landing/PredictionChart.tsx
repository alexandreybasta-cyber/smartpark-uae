'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(LineController, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function PredictionChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const hours: string[] = [];
    const actual: (number | null)[] = [];
    const predicted: number[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const h = new Date(now.getTime() + i * 3600000);
      hours.push(h.getHours().toString().padStart(2, '0') + ':00');
      if (i < 3) {
        const base = 65 + Math.sin(i * 0.8) * 10;
        actual.push(Math.round(base + i * 3));
        predicted.push(Math.round(base + i * 3 + 2));
      } else {
        actual.push(null);
        const peak = i >= 5 && i <= 8;
        predicted.push(Math.round(peak ? 85 + Math.random() * 10 : 55 + Math.random() * 15 + i * 2));
      }
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Actual Occupancy',
            data: actual,
            borderColor: '#00e5a0',
            backgroundColor: 'rgba(0,229,160,0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#00e5a0',
            spanGaps: false,
          },
          {
            label: 'AI Predicted',
            data: predicted,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168,85,247,0.05)',
            borderWidth: 2,
            borderDash: [6, 4],
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#a855f7',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 12 },
              boxWidth: 12,
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: '#0f1629',
            borderColor: 'rgba(148,163,184,0.15)',
            borderWidth: 1,
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            titleFont: { family: 'Inter', weight: 'bold' },
            bodyFont: { family: 'Inter' },
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ': ' + (ctx.parsed.y !== null ? ctx.parsed.y + '%' : 'N/A');
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.05)' },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
          },
          y: {
            min: 30,
            max: 100,
            grid: { color: 'rgba(148,163,184,0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', size: 11 },
              callback: (v) => v + '%',
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mt-8 bg-sp-bg-2/70 border border-white/[0.08] rounded-2xl p-6 relative">
      <div className="flex justify-between items-center mb-5">
        <div className="text-[15px] font-bold">Predictive Availability — Next 12 Hours</div>
        <div className="px-3 py-1 rounded-full text-[11px] font-semibold bg-sp-purple/15 text-sp-purple border border-sp-purple/20">
          AI Prediction Agent
        </div>
      </div>
      <div className="h-[280px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
