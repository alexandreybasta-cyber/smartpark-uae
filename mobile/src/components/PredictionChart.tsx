import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';
import { Prediction } from '../types';

interface Props {
  predictions: Prediction[];
  width: number;
  height?: number;
}

const PAD_LEFT = 34;
const PAD_RIGHT = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

function dubaiLabel(iso: string): string {
  const d = new Date(iso);
  const hour = (d.getUTCHours() + 4) % 24;
  return `${String(hour).padStart(2, '0')}:00`;
}

// 12-hour occupancy forecast line chart (SVG). Red band marks the >80% peak
// zone, per the spec's prediction-chart requirements.
export default function PredictionChart({ predictions, width, height = 220 }: Props) {
  if (predictions.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>No prediction data</Text>
      </View>
    );
  }

  const plotW = width - PAD_LEFT - PAD_RIGHT;
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_LEFT + (i / Math.max(1, predictions.length - 1)) * plotW;
  const y = (occ: number) => PAD_TOP + (1 - occ / 100) * plotH;

  const points = predictions.map((p, i) => `${x(i).toFixed(1)},${y(p.predicted_occupancy).toFixed(1)}`).join(' ');

  // X labels every ~2 hours (8 intervals of 15 min)
  const labelIdx: number[] = [];
  for (let i = 0; i < predictions.length; i += 8) labelIdx.push(i);

  return (
    <Svg width={width} height={height}>
      {/* Peak band >80% */}
      <Rect x={PAD_LEFT} y={y(100)} width={plotW} height={y(80) - y(100)} fill={colors.red} opacity={0.08} />
      <Line x1={PAD_LEFT} y1={y(80)} x2={width - PAD_RIGHT} y2={y(80)} stroke={colors.red} strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />

      {/* Gridlines + Y labels */}
      {[0, 25, 50, 75, 100].map((v) => (
        <React.Fragment key={v}>
          <Line x1={PAD_LEFT} y1={y(v)} x2={width - PAD_RIGHT} y2={y(v)} stroke={colors.bg3} strokeWidth={1} />
          <SvgText x={PAD_LEFT - 6} y={y(v) + 4} fill={colors.text3} fontSize={10} textAnchor="end">
            {v}%
          </SvgText>
        </React.Fragment>
      ))}

      {/* Prediction line */}
      <Polyline points={points} fill="none" stroke={colors.purple} strokeWidth={2} strokeDasharray="6 3" />

      {/* Now marker */}
      <Circle cx={x(0)} cy={y(predictions[0].predicted_occupancy)} r={4} fill={colors.cyan} />

      {/* X labels */}
      {labelIdx.map((i) => (
        <SvgText key={i} x={x(i)} y={height - 6} fill={colors.text3} fontSize={10} textAnchor="middle">
          {dubaiLabel(predictions[i].timestamp)}
        </SvgText>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.text3,
    fontSize: 13,
  },
});
