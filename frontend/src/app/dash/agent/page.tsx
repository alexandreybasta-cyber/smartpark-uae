'use client';

import { FormEvent, useState } from 'react';
import { sendAgentQuery } from '@/lib/api';
import { Card, PageHeader } from '@/components/dash/ui';

interface Msg { role: 'user' | 'agent'; text: string; steps?: string[] }

export default function AgentPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'agent', text: 'SpotSense agent console. Ask about availability, comparisons, navigation or payments.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    try {
      const res = await sendAgentQuery(text, 25.0935, 55.1590);
      setMessages((m) => [...m, {
        role: 'agent',
        text: res.text ?? 'No response',
        steps: res.reasoning_steps ?? [],
      }]);
    } catch (err) {
      setMessages((m) => [...m, {
        role: 'agent',
        text: `Agent error: ${err instanceof Error ? err.message : 'unknown'}`,
      }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Agent"
                  sub="Voice and text reasoning over the live ledger: find, compare, navigate, pay" />
      <Card>
        <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 text-zinc-800'}`}>
                <div className="whitespace-pre-wrap">{m.text}</div>
                {m.steps && m.steps.length > 0 ? (
                  <ul className="mt-2 text-[11px] text-zinc-500 list-disc pl-4">
                    {m.steps.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex gap-2 mt-4">
          <input value={input} onChange={(e) => setInput(e.target.value)}
                 placeholder="e.g. where can I park near my office for 2 hours?"
                 className="flex-1 border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <button type="submit" disabled={busy}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md px-4 py-2">
            {busy ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </Card>
    </div>
  );
}
