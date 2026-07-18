import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [140, 180], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.2, 0.6]);

  const accentWidth = interpolate(frame, [50, 90], [0, 300], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        opacity: fadeOut,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, #007AFF22 0%, transparent 70%)",
          opacity: glowPulse,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          fontSize: 110,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: -2,
          textShadow: "0 0 80px rgba(0,122,255,0.4)",
        }}
      >
        SpotSense
      </div>

      {/* Accent line */}
      <div
        style={{
          marginTop: 30,
          width: accentWidth,
          height: 3,
          backgroundColor: "#007AFF",
          borderRadius: 2,
        }}
      />

      {/* Subtitle typewriter */}
      <div style={{ marginTop: 40 }}>
        <AnimatedText
          text="Smart Parking, Reimagined"
          type="typewriter"
          delay={50}
          duration={50}
          style={{
            fontSize: 42,
            color: "#8e8e93",
            fontWeight: 400,
            letterSpacing: 2,
          }}
        />
      </div>

      {/* Footer tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          opacity: interpolate(frame, [100, 120], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          fontSize: 26,
          color: "#636366",
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        yc demo 2026
      </div>
    </AbsoluteFill>
  );
};
