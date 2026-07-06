'use client';

interface SuggestionChipsProps {
  onSelect: (query: string) => void;
}

const suggestions = [
  'Where can I park right now?',
  'When is peak hour?',
  'Show zone comparison',
  'Predict next 2 hours',
];

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {suggestions.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="px-4 py-2 rounded-full bg-sp-bg-3 border border-sp-bg-3 text-sp-text-2 text-xs font-medium hover:border-sp-cyan hover:text-sp-text-1 transition-colors"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
