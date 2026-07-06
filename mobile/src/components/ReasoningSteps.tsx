import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  steps: string[];
  animate?: boolean;
  onDone?: () => void;
}

// Reveals the agent's reasoning chain step by step (600ms cadence,
// matching the web demo), then calls onDone.
export default function ReasoningSteps({ steps, animate = true, onDone }: Props) {
  const [visible, setVisible] = useState(animate ? 0 : steps.length);

  useEffect(() => {
    if (!animate) return;
    if (visible >= steps.length) {
      const t = setTimeout(() => onDone?.(), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 600);
    return () => clearTimeout(t);
  }, [visible, steps.length, animate, onDone]);

  if (steps.length === 0) return null;

  return (
    <View style={styles.box}>
      {steps.slice(0, visible).map((step, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.step}>{step}</Text>
        </View>
      ))}
      {visible < steps.length && <Text style={styles.thinking}>…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.bg1,
    borderRadius: radius.small,
    borderLeftWidth: 2,
    borderLeftColor: colors.purple,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  check: {
    color: colors.purple,
    fontSize: 12,
  },
  step: {
    color: colors.text2,
    fontSize: 12,
    flex: 1,
  },
  thinking: {
    color: colors.purple,
    fontSize: 12,
  },
});
