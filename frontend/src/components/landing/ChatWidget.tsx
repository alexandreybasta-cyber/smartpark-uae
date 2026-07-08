'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  type: 'ai' | 'user';
  time: string;
}

const SUGGESTIONS = [
  'Where can I park right now?',
  'When is peak hour?',
  'How does enforcement work?',
  'Predict next 2 hours',
];

const RESPONSES: Record<string, string> = {
  'park right now':
    'Based on real-time sensor data, <strong>Zone B</strong> has the most availability with <span class="inline-block px-2 py-0.5 rounded bg-sp-cyan/15 text-sp-cyan font-mono text-xs font-semibold">11/16 spots free</span>. The nearest free spot is <strong>B-04</strong>, approximately 45m from your current location.',
  'peak hour':
    'Based on historical patterns, peak occupancy occurs between <span class="inline-block px-2 py-0.5 rounded bg-sp-cyan/15 text-sp-cyan font-mono text-xs font-semibold">5:00 PM - 8:00 PM</span> (88-92% full). I recommend arriving before <strong>4:30 PM</strong> for best availability.',
  'zone comparison':
    '<span class="inline-block px-2 py-0.5 rounded bg-sp-cyan/15 text-sp-cyan font-mono text-xs font-semibold">Zone A: 9/16 free (56%)</span><br/><span class="inline-block px-2 py-0.5 rounded bg-sp-cyan/15 text-sp-cyan font-mono text-xs font-semibold">Zone B: 11/16 free (69%)</span><br/><span class="inline-block px-2 py-0.5 rounded bg-sp-cyan/15 text-sp-cyan font-mono text-xs font-semibold">Zone C: 6/16 free (38%)</span><br/><br/>Zone B currently offers the best availability.',
  predict:
    'Prediction for next 2 hours:<br/><br/><span class="inline-block px-2 py-0.5 rounded bg-sp-cyan/15 text-sp-cyan font-mono text-xs font-semibold">Current: 62%</span> → Expected to rise to <span class="inline-block px-2 py-0.5 rounded bg-sp-cyan/15 text-sp-cyan font-mono text-xs font-semibold">78%</span> in 2 hours.<br/><br/>Recommendation: Park within the next <strong>30 minutes</strong> for best selection.',
  'enforcement':
    'SpotSense\'s sensors detect vehicle occupancy and cross-reference with <strong>the operator\'s payment database</strong> in real-time:<br/><br/><span class="inline-block px-2 py-0.5 rounded bg-red-500/15 text-red-500 font-mono text-xs font-semibold">1. Sensor detects car</span> → <span class="inline-block px-2 py-0.5 rounded bg-red-500/15 text-red-500 font-mono text-xs font-semibold">2. Check payment</span> → <span class="inline-block px-2 py-0.5 rounded bg-red-500/15 text-red-500 font-mono text-xs font-semibold">3. Flag unpaid</span><br/><br/>No manual inspectors needed. Covers <strong>100% of monitored streets 24/7</strong>.',
};

function getResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  return 'SpotSense\'s agentic AI can help with real-time availability, zone comparisons, peak hour predictions, and parking guidance. Try asking about zone availability or when peak hours are.';
}

function getTime(): string {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: "Hi! I'm the SpotSense AI assistant. I can help you find parking, check zone availability, or predict peak hours. Try asking me something below.",
      type: 'ai',
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: idRef.current++, text, type: 'user', time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response = getResponse(text);
      const aiMsg: Message = { id: idRef.current++, text: response, type: 'ai', time: getTime() };
      setTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
    }, 600 + Math.random() * 800);
  };

  return (
    <div className="bg-sp-bg-2 border border-white/[0.08] rounded-[20px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-3 bg-sp-bg-3">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-sp-cyan to-sp-blue flex items-center justify-center text-base font-extrabold text-sp-bg-0">
          SP
        </div>
        <div>
          <h4 className="text-sm font-bold">SpotSense AI</h4>
          <span className="text-[11px] text-sp-cyan font-medium">Agentic Assistant &middot; Online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="h-[360px] overflow-y-auto p-5 flex flex-col gap-4 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`max-w-[85%] animate-fade-in ${msg.type === 'ai' ? 'self-start' : 'self-end'}`}>
            <div
              className={`px-4 py-3 rounded-[14px] text-[13px] leading-relaxed ${
                msg.type === 'ai'
                  ? 'bg-sp-bg-3 border border-white/[0.08] rounded-bl-[4px] text-sp-text-1'
                  : 'bg-sp-cyan/15 border border-sp-cyan/20 rounded-br-[4px] text-sp-text-1'
              }`}
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
            <div className={`text-[10px] text-sp-text-3 mt-1 px-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
              {msg.time}
            </div>
          </div>
        ))}
        {typing && (
          <div className="self-start max-w-[85%]">
            <div className="bg-sp-bg-3 border border-white/[0.08] rounded-[14px] rounded-bl-[4px] px-4 py-3 text-[13px] text-sp-text-3">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sp-text-3 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-sp-text-3 animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-sp-text-3 animate-pulse [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((sug) => (
          <button
            key={sug}
            onClick={() => sendMessage(sug)}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-sp-bg-3 border border-white/[0.08] text-sp-text-2 cursor-pointer transition-all hover:border-sp-cyan hover:text-sp-cyan hover:bg-sp-cyan/15"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-white/[0.08] flex gap-2.5 bg-sp-bg-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about parking..."
          className="flex-1 px-4 py-2.5 rounded-[10px] bg-sp-bg-2 border border-white/[0.08] text-sp-text-1 text-[13px] outline-none focus:border-sp-cyan transition-colors placeholder:text-sp-text-3"
        />
        <button
          onClick={() => sendMessage(input)}
          className="w-10 h-10 rounded-[10px] bg-sp-cyan flex items-center justify-center cursor-pointer hover:scale-105 hover:shadow-[0_4px_16px_rgba(0,229,160,0.3)] transition-all shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[18px] h-[18px] text-sp-bg-0">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
