import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface PulsingDotProps {
  x: number;
  y: number;
  color?: string;
  size?: number;
  delay?: number;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
  x,
  y,
  color = "#34C759",
  size = 24,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - delay;

  const pulseScale = interpolate(
    Math.sin(adjustedFrame * 0.15),
    [-1, 1],
    [1, 1.5]
  );

  const pulseOpacity = interpolate(
    Math.sin(adjustedFrame * 0.15),
    [-1, 1],
    [0.4, 1]
  );

  const ringScale = interpolate(
    Math.sin(adjustedFrame * 0.1),
    [-1, 1],
    [1.5, 2.5]
  );

  const ringOpacity = interpolate(
    Math.sin(adjustedFrame * 0.1),
    [-1, 1],
    [0.3, 0]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: ringOpacity,
          transform: `scale(${ringScale})`,
        }}
      />
      {/* Core dot */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: pulseOpacity,
          transform: `scale(${pulseScale})`,
          boxShadow: `0 0 ${20}px ${color}`,
        }}
      />
    </div>
  );
};
