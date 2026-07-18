import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";
import { PulsingDot } from "../components/PulsingDot";

export const EnforcementScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [500, 0]);

  const zoomScale = interpolate(frame, [40, 130], [1, 1.12], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const bannerPulse = interpolate(Math.sin(frame * 0.25), [-1, 1], [0.85, 1]);

  const subtextOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const messageOpacity = interpolate(frame, [70, 90], [0, 1], {
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
          text="Enforcement Mode"
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
            fontSize: 28,
            color: "#8e8e93",
            fontWeight: 400,
          }}
        >
          Dedicated dashboard for parking enforcement officers
        </div>
      </div>

      {/* Phone */}
      <div
        style={{
          transform: `translateY(${phoneY}px)`,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/Enforcement 1 - Map.JPG"
          scale={0.95}
          zoom={zoomScale}
        />
      </div>

      {/* Red violation dots */}
      <PulsingDot x={350} y={550} color="#FF3B30" size={28} delay={40} />
      <PulsingDot x={500} y={620} color="#FF3B30" size={28} delay={45} />
      <PulsingDot x={280} y={700} color="#FF3B30" size={28} delay={50} />
      <PulsingDot x={600} y={750} color="#FF3B30" size={28} delay={55} />
      <PulsingDot x={420} y={820} color="#FF3B30" size={28} delay={60} />

      {/* Key message banner */}
      <div
        style={{
          position: "absolute",
          bottom: 260,
          left: "50%",
          transform: `translateX(-50%) scale(${bannerPulse})`,
          backgroundColor: "rgba(255,59,48,0.9)",
          borderRadius: 20,
          padding: "16px 40px",
          opacity: messageOpacity,
          zIndex: 20,
          boxShadow: "0 8px 32px rgba(255,59,48,0.5)",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>
          From hours of patrol to seconds of dispatch
        </span>
      </div>
    </AbsoluteFill>
  );
};
