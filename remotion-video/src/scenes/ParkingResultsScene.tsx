import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";
import { PulsingDot } from "../components/PulsingDot";

export const ParkingResultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [600, 0]);

  const counterValue = Math.floor(
    interpolate(frame, [50, 90], [0, 7], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const counterOpacity = interpolate(frame, [45, 60], [0, 1], {
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
          text="Real-time availability"
          type="fade"
          delay={30}
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        />
      </div>

      {/* Phone */}
      <div style={{ opacity: fadeIn, transform: `translateY(${phoneY}px)` }}>
        <PhoneFrame
          imagePath="screenshots/Map - 2 After pressing Generate.JPG"
          scale={0.95}
        />
      </div>

      {/* Pulsing green dots overlay */}
      <PulsingDot x={320} y={650} color="#34C759" size={20} delay={40} />
      <PulsingDot x={480} y={580} color="#34C759" size={20} delay={45} />
      <PulsingDot x={600} y={720} color="#34C759" size={20} delay={50} />
      <PulsingDot x={250} y={800} color="#34C759" size={20} delay={55} />

      {/* Counter overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(52,199,89,0.9)",
          borderRadius: 20,
          padding: "16px 40px",
          opacity: counterOpacity,
          zIndex: 20,
          boxShadow: "0 8px 32px rgba(52,199,89,0.4)",
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          {counterValue} Free Spots Found
        </span>
      </div>
    </AbsoluteFill>
  );
};
