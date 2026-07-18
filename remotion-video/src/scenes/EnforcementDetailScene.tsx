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

  const subtextOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const statOpacity = interpolate(frame, [60, 80], [0, 1], {
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
        <div
          style={{
            marginTop: 12,
            opacity: subtextOpacity,
            fontSize: 26,
            color: "#8e8e93",
            fontWeight: 400,
          }}
        >
          Occupancy sensors detect overstay in real-time
        </div>
      </div>

      {/* Phone */}
      <div
        style={{
          transform: `translateY(${phoneY}px)`,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/Enforcement 2 - Violation.JPG"
          scale={0.95}
          zoom={zoomScale}
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

      {/* Key stat card */}
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(28,28,30,0.95)",
          borderRadius: 20,
          padding: "16px 36px",
          opacity: statOpacity,
          zIndex: 20,
          border: "1px solid rgba(255,59,48,0.4)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 22, color: "#8e8e93", marginBottom: 6 }}>
          Grace period expired → Automatic dispatch
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#FF3B30" }}>
          Bay C-13 · Parked 1h 45m · Grace expired
        </div>
      </div>

      {/* Grace expired flashing highlight */}
      <div
        style={{
          position: "absolute",
          bottom: 230,
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
