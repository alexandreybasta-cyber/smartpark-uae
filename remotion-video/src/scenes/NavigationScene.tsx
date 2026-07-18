import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const NavigationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const phoneX = interpolate(slideIn, [0, 1], [600, 0]);

  const routePulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.6, 1]);

  const timeScale = interpolate(frame, [50, 80], [0.8, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const timeBounce = spring({
    frame: frame - 50,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <AnimatedText
          text="Seamless navigation integration"
          type="fade"
          delay={25}
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        />
      </div>

      {/* Phone sliding from right */}
      <div style={{ transform: `translateX(${phoneX}px)` }}>
        <PhoneFrame
          imagePath="screenshots/Map - 4 Waze redirection.JPG"
          scale={0.95}
        />
      </div>

      {/* Route line pulse overlay */}
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 200,
          width: 400,
          height: 6,
          background: "linear-gradient(90deg, #007AFF, #5AC8FA)",
          borderRadius: 3,
          opacity: routePulse,
          zIndex: 15,
          boxShadow: "0 0 20px rgba(0,122,255,0.6)",
          transform: `scaleX(${interpolate(frame, [40, 80], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          })})`,
          transformOrigin: "left",
        }}
      />

      {/* 1 min badge */}
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: "50%",
          transform: `translateX(-50%) scale(${timeBounce})`,
          backgroundColor: "rgba(0,122,255,0.9)",
          borderRadius: 16,
          padding: "12px 32px",
          opacity: interpolate(frame, [50, 65], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          zIndex: 20,
          boxShadow: "0 8px 32px rgba(0,122,255,0.4)",
        }}
      >
        <span style={{ fontSize: 48, fontWeight: 800, color: "#fff" }}>
          1 min
        </span>
      </div>
    </AbsoluteFill>
  );
};
