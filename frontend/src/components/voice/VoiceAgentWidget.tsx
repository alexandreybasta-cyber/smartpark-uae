'use client';

import VoiceProvider from './VoiceProvider';
import VoiceButton from './VoiceButton';
import VoiceOverlay from './VoiceOverlay';
import ChatPanel from './ChatPanel';

/**
 * Drop-in voice agent widget.
 * Add <VoiceAgentWidget /> to your layout or page to enable
 * the floating voice button + overlay + chat panel.
 */
export default function VoiceAgentWidget() {
  return (
    <VoiceProvider>
      <VoiceButton />
      <VoiceOverlay />
      <ChatPanel />
    </VoiceProvider>
  );
}
