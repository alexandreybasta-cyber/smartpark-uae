'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useVoiceContext } from './VoiceProvider';
import MapCard from './MapCard';
import SuggestionChips from './SuggestionChips';

export default function ChatPanel() {
  const { isChatOpen, toggleChat, chatHistory, addUserMessage, state } = useVoiceContext();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!isChatOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    addUserMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col md:flex-row md:justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-sp-bg-0/60 backdrop-blur-sm" onClick={toggleChat} />

      {/* Panel */}
      <div className="relative mt-auto md:mt-0 md:ml-auto w-full md:w-96 h-[80vh] md:h-full bg-sp-bg-1 border-t md:border-l border-sp-bg-3 flex flex-col rounded-t-2xl md:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sp-bg-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sp-cyan/20 flex items-center justify-center">
              <span className="text-sp-cyan text-xs font-bold">SP</span>
            </div>
            <div>
              <p className="text-sp-text-1 text-sm font-medium">SmartPark AI</p>
              <p className="text-sp-text-3 text-[10px]">Always available</p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sp-bg-2 text-sp-text-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 rounded-full bg-sp-cyan/10 flex items-center justify-center">
                <span className="text-sp-cyan font-bold">SP</span>
              </div>
              <p className="text-sp-text-2 text-sm text-center">
                Ask me anything about parking in Dubai Internet City
              </p>
              <SuggestionChips onSelect={(q) => { addUserMessage(q); }} />
            </div>
          )}

          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${msg.role === 'user' ? '' : 'flex gap-2'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-sp-cyan/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-sp-cyan text-[9px] font-bold">SP</span>
                  </div>
                )}
                <div>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-sp-blue text-white rounded-br-sm'
                        : 'bg-sp-bg-2 text-sp-text-1 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.mapCard && (
                    <div className="mt-2">
                      <MapCard data={msg.mapCard} />
                    </div>
                  )}
                  <p className="text-sp-text-3 text-[10px] mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {state === 'processing' && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sp-cyan/20 flex items-center justify-center">
                <span className="text-sp-cyan text-[9px] font-bold">SP</span>
              </div>
              <div className="bg-sp-bg-2 px-3 py-2 rounded-xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-sp-text-3 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-sp-text-3 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-sp-text-3 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips (when empty) */}
        {chatHistory.length > 0 && state === 'idle' && (
          <div className="px-4 py-2 border-t border-sp-bg-3">
            <SuggestionChips onSelect={(q) => { addUserMessage(q); }} />
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-sp-bg-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about parking..."
              className="flex-1 bg-sp-bg-2 border border-sp-bg-3 rounded-full px-4 py-2 text-sm text-sp-text-1 placeholder:text-sp-text-3 focus:outline-none focus:border-sp-cyan transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-sp-cyan flex items-center justify-center text-sp-bg-0 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
