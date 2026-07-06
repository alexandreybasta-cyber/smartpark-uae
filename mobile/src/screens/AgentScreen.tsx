import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { sendAgentQuery } from '../api';
import MapCardView from '../components/MapCardView';
import ReasoningSteps from '../components/ReasoningSteps';
import { MicIcon, SendIcon, SpeakerIcon } from '../components/icons';
import { useApp } from '../context/AppContext';
import { runLocalAgent } from '../localAgent';
import { seedPlaces } from '../seed';
import { colors, radius } from '../theme';
import { AgentResponse, DEMO_LOCATION } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  response?: AgentResponse;
  revealed?: boolean; // reasoning animation finished
}

const SUGGESTIONS = [
  'Find parking near my work',
  'Which zone has the most free spots?',
  'Will it be busy at 6pm?',
  'Pay for my spot',
];

export default function AgentScreen() {
  const { zones, spots, mode, pendingAgentQuery } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const scrollRef = useRef<ScrollView | null>(null);
  const lastQueryToken = useRef<number>(0);

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled) return;
      Speech.stop();
      Speech.speak(text, { language: 'en-US', rate: 1.0 });
    },
    [ttsEnabled]
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      setInput('');
      setBusy(true);
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
      setMessages((prev) => [...prev, userMsg]);

      let response: AgentResponse;
      if (mode === 'live') {
        try {
          response = await sendAgentQuery(text, DEMO_LOCATION.lat, DEMO_LOCATION.lng);
        } catch {
          response = runLocalAgent(text, zones, spots, seedPlaces);
        }
      } else {
        response = runLocalAgent(text, zones, spots, seedPlaces);
      }

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'agent', text: response.text, response, revealed: false },
      ]);
      setBusy(false);
    },
    [busy, mode, zones, spots]
  );

  // Query handed over from another tab (Places → "Find parking near…").
  useEffect(() => {
    if (pendingAgentQuery && pendingAgentQuery.token !== lastQueryToken.current) {
      lastQueryToken.current = pendingAgentQuery.token;
      send(pendingAgentQuery.text);
    }
  }, [pendingAgentQuery, send]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages]);

  const onMicPress = () => {
    Alert.alert(
      'Voice input',
      'Live speech-to-text needs a development build (Expo Go cannot load the native speech module). Type your query or tap a suggestion — the agent pipeline is identical.'
    );
  };

  const onReasoningDone = useCallback(
    (id: string, text: string) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, revealed: true } : m)));
      speak(text);
    },
    [speak]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SmartPark Agent</Text>
          <Text style={styles.subtitle}>
            {mode === 'live' ? 'Connected to backend agent' : 'Offline demo agent (on-device)'}
          </Text>
        </View>
        <Pressable onPress={() => setTtsEnabled((v) => !v)} hitSlop={10} style={styles.ttsButton}>
          <SpeakerIcon color={ttsEnabled ? colors.cyan : colors.text3} muted={!ttsEnabled} />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent}>
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Ask me about parking</Text>
            <Text style={styles.emptyText}>
              I resolve your saved places, search zones within 500m, and rank them by availability, distance and
              predicted occupancy.
            </Text>
          </View>
        )}

        {messages.map((msg) =>
          msg.role === 'user' ? (
            <View key={msg.id} style={styles.userBubble}>
              <Text style={styles.userText}>{msg.text}</Text>
            </View>
          ) : (
            <View key={msg.id} style={styles.agentBlock}>
              {msg.response && msg.response.reasoning_steps.length > 0 && (
                <ReasoningSteps
                  steps={msg.response.reasoning_steps}
                  animate={!msg.revealed}
                  onDone={() => onReasoningDone(msg.id, msg.text)}
                />
              )}
              {(msg.revealed || !msg.response?.reasoning_steps.length) && (
                <View style={styles.agentBubble}>
                  <Text style={styles.agentText}>{msg.text}</Text>
                  {msg.response?.map_card && <MapCardView card={msg.response.map_card} />}
                </View>
              )}
            </View>
          )
        )}
        {busy && <Text style={styles.thinking}>thinking…</Text>}
      </ScrollView>

      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={styles.chip} onPress={() => send(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputRow}>
        <Pressable style={styles.micButton} onPress={onMicPress}>
          <MicIcon color={colors.bg0} size={22} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about parking…"
          placeholderTextColor={colors.text3}
          returnKeyType="send"
          onSubmitEditing={() => send(input)}
        />
        <Pressable style={styles.sendButton} onPress={() => send(input)} disabled={busy}>
          <SendIcon color={input.trim() && !busy ? colors.cyan : colors.text3} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text1,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.text3,
    fontSize: 12,
    marginTop: 2,
  },
  ttsButton: {
    padding: 6,
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    color: colors.text1,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.text3,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.blue,
    borderRadius: radius.card,
    borderBottomRightRadius: radius.small,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
  },
  agentBlock: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    gap: 8,
  },
  agentBubble: {
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    borderBottomLeftRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  agentText: {
    color: colors.text1,
    fontSize: 15,
    lineHeight: 21,
  },
  thinking: {
    color: colors.purple,
    fontSize: 13,
    marginLeft: 4,
  },
  chipsRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  chips: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.badge,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: colors.text2,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text1,
    fontSize: 15,
  },
  sendButton: {
    padding: 8,
  },
});
