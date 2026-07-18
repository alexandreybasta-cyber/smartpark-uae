import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const subtitle2Opacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const glowPulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.3, 0.8]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, #007AFF33 0%, transparent 70%)",
          opacity: glowPulse,
        }}
      />

      {/* Title */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          fontSize: 120,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: -2,
          textShadow: "0 0 60px rgba(0,122,255,0.5)",
        }}
      >
        SpotSense
      </div>

      {/* Subtitle with typewriter */}
      <div style={{ marginTop: 30, opacity: subtitleOpacity }}>
        <AnimatedText
          text="Agentic AI-Powered Smart Parking"
          type="typewriter"
          delay={30}
          duration={40}
          style={{
            fontSize: 40,
            color: "#8e8e93",
            fontWeight: 400,
            letterSpacing: 2,
          }}
        />
      </div>

      {/* Second subtitle line */}
      <div style={{ marginTop: 16, opacity: subtitle2Opacity }}>
        <AnimatedText
          text="City Scale Real-time Parking Spot Availability."
          type="typewriter"
          delay={70}
          duration={30}
          style={{
            fontSize: 28,
            color: "#636366",
            fontWeight: 400,
            letterSpacing: 1,
          }}
        />
      </div>

      {/* Accent line */}
      <div
        style={{
          marginTop: 40,
          width: interpolate(frame, [40, 70], [0, 200], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          height: 3,
          backgroundColor: "#007AFF",
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
