'use client';

import { PlacesProvider } from '@/components/places/PlacesContext';
import VoiceProvider from '@/components/voice/VoiceProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlacesProvider>
      <VoiceProvider>
        {children}
      </VoiceProvider>
    </PlacesProvider>
  );
}
