'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useVoiceAgent, UseVoiceAgentReturn } from '@/hooks/useVoiceAgent';
import { AgentResult } from '@/lib/agentResponses';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  mapCard?: AgentResult['mapCard'];
}

interface VoiceContextType extends UseVoiceAgentReturn {
  isOverlayOpen: boolean;
  isChatOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  toggleChat: () => void;
  chatHistory: ChatMessage[];
  addUserMessage: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export function useVoiceContext() {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error('useVoiceContext must be used within VoiceProvider');
  }
  return ctx;
}

interface VoiceProviderProps {
  children: ReactNode;
}

export default function VoiceProvider({ children }: VoiceProviderProps) {
  const voiceAgent = useVoiceAgent();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const openOverlay = useCallback(() => {
    setIsOverlayOpen(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setIsChatOpen(false);
    voiceAgent.reset();
  }, [voiceAgent]);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const addUserMessage = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        text,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userMsg]);

      // Process and wait for response
      voiceAgent.sendText(text);

      // We'll add assistant message when response arrives via effect
      const checkResponse = setInterval(() => {
        if (voiceAgent.response) {
          const aiMsg: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            role: 'assistant',
            text: voiceAgent.response.text,
            timestamp: new Date(),
            mapCard: voiceAgent.response.mapCard,
          };
          setChatHistory((prev) => [...prev, aiMsg]);
          clearInterval(checkResponse);
        }
      }, 200);

      // Safety timeout
      setTimeout(() => clearInterval(checkResponse), 10000);
    },
    [voiceAgent]
  );

  return (
    <VoiceContext.Provider
      value={{
        ...voiceAgent,
        isOverlayOpen,
        isChatOpen,
        openOverlay,
        closeOverlay,
        toggleChat,
        chatHistory,
        addUserMessage,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}
