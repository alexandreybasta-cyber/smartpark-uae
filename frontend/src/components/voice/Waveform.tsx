'use client';

interface WaveformProps {
  isListening: boolean;
}

export default function Waveform({ isListening }: WaveformProps) {
  const bars = 7;
  const delays = [0, 0.15, 0.3, 0.1, 0.25, 0.4, 0.2];

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-sp-cyan transition-all duration-300"
          style={{
            height: isListening ? '100%' : '20%',
            animation: isListening
              ? `waveform 1.2s ease-in-out infinite`
              : 'none',
            animationDelay: `${delays[i]}s`,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}
