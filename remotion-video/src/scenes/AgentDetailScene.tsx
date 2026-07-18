import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const AgentDetailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [400, 0]);

  const zoomScale = interpolate(frame, [30, 120], [1, 1.18], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const statsCount1 = Math.floor(
    interpolate(frame, [60, 100], [0, 10], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const statsCount2 = Math.floor(
    interpolate(frame, [70, 110], [0, 30], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const statsOpacity = interpolate(frame, [55, 75], [0, 1], {
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
          text="Instant zone insights"
          type="fade"
          delay={25}
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
          transform: `translateY(${phoneY}px)`,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/Agent 2 - Burj kHALIFA.JPG"
          scale={0.95}
          zoom={zoomScale}
        />
      </div>

      {/* Stats counter overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 80,
          right: 80,
          zIndex: 20,
          opacity: statsOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(28,28,30,0.95)",
            borderRadius: 24,
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-around",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: "#34C759" }}>
              {statsCount1}
            </div>
            <div style={{ fontSize: 22, color: "#8e8e93" }}>Free Now</div>
          </div>
          <div
            style={{
              width: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: "#007AFF" }}>
              {statsCount2}
            </div>
            <div style={{ fontSize: 22, color: "#8e8e93" }}>Total Spots</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
