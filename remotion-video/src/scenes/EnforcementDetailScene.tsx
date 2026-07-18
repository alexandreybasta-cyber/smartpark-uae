import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const EnforcementDetailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [500, 0]);

  const zoomScale = interpolate(frame, [30, 120], [1, 1.15], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const occupiedPulse = interpolate(Math.sin(frame * 0.25), [-1, 1], [1, 1.12]);

  const graceFlash = interpolate(
    Math.sin(frame * 0.3),
    [-1, 1],
    [0.6, 1]
  );

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
          text="Instant violation detection"
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

      {/* Phone */}
      <div
        style={{
          transform: `translateY(${phoneY}px) scale(${zoomScale})`,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/Enforcement 2 - Violation.JPG"
          scale={0.95}
        />
      </div>

      {/* Occupied badge pulse */}
      <div
        style={{
          position: "absolute",
          top: 520,
          right: 150,
          backgroundColor: "#FF3B30",
          borderRadius: 12,
          padding: "10px 28px",
          transform: `scale(${occupiedPulse})`,
          opacity: interpolate(frame, [40, 55], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          zIndex: 20,
          boxShadow: "0 0 30px rgba(255,59,48,0.6)",
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>
          OCCUPIED
        </span>
      </div>

      {/* Grace expired highlight */}
      <div
        style={{
          position: "absolute",
          bottom: 320,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(255,59,48,0.15)",
          borderRadius: 16,
          padding: "12px 32px",
          opacity: graceFlash,
          zIndex: 20,
          border: "2px solid rgba(255,59,48,0.6)",
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#FF3B30",
            textTransform: "uppercase",
          }}
        >
          Grace Expired
        </span>
      </div>
    </AbsoluteFill>
  );
};
