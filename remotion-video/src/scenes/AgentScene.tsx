import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const AgentScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideFromLeft = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const phoneX = interpolate(slideFromLeft, [0, 1], [-600, 0]);

  const cardSlideUp = spring({
    frame: frame - 120,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const cardY = interpolate(cardSlideUp, [0, 1], [200, 0]);

  const cardOpacity = interpolate(frame, [120, 140], [0, 1], {
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
          text="AI Parking Assistant"
          type="fade"
          delay={20}
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        />
      </div>

      {/* Phone sliding from left */}
      <div style={{ transform: `translateX(${phoneX}px)` }}>
        <PhoneFrame imagePath="screenshots/Agent.JPG" scale={0.95} />
      </div>

      {/* Typewriter overlay for user message */}
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 120,
          right: 120,
          zIndex: 20,
          opacity: interpolate(frame, [30, 40], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
        }}
      >
        <AnimatedText
          text="Parking burj khalifa"
          type="typewriter"
          delay={30}
          duration={50}
          style={{
            fontSize: 28,
            color: "#fff",
            backgroundColor: "rgba(0,122,255,0.8)",
            padding: "12px 20px",
            borderRadius: 20,
            display: "inline-block",
          }}
        />
      </div>

      {/* AI response fade in */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: 120,
          right: 200,
          zIndex: 20,
          opacity: interpolate(frame, [80, 100], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          transform: `translateY(${interpolate(frame, [80, 100], [20, 0], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          })}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(44,44,46,0.85)",
            borderRadius: 20,
            padding: "16px 20px",
            fontSize: 22,
            color: "#e5e5ea",
            lineHeight: 1.5,
          }}
        >
          Finding parking zones near Burj Khalifa...
        </div>
      </div>

      {/* Parking zone card slide up */}
      <div
        style={{
          position: "absolute",
          bottom: 250,
          left: 100,
          right: 100,
          zIndex: 20,
          transform: `translateY(${cardY}px)`,
          opacity: cardOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(28,28,30,0.95)",
            borderRadius: 24,
            padding: "24px 32px",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ fontSize: 26, color: "#8e8e93", marginBottom: 8 }}>
            Zone A - Downtown
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 48, fontWeight: 800, color: "#34C759" }}>10</span>
              <span style={{ fontSize: 28, color: "#8e8e93" }}> / 30 free</span>
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#007AFF",
              }}
            >
              AED 5/hr
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
