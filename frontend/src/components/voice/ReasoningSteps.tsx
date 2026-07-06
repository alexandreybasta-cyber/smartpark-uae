'use client';

interface ReasoningStepsProps {
  steps: string[];
  visibleCount: number;
}

export default function ReasoningSteps({ steps, visibleCount }: ReasoningStepsProps) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-start gap-2 transition-all duration-300"
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <span className="mt-1 w-2 h-2 rounded-full bg-sp-cyan shrink-0" />
          <span className="text-sp-text-2 text-sm">{step}</span>
        </div>
      ))}
    </div>
  );
}
