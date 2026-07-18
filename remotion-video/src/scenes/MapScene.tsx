import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";
import { PulsingDot } from "../components/PulsingDot";

export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [800, 0]);

  const zoomScale = interpolate(frame, [60, 150], [1, 1.15], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const tapPulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.8, 1.2]);

  const textOpacity = interpolate(frame, [40, 60], [0, 1], {
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
          opacity: textOpacity,
        }}
      >
        <AnimatedText
          text="Find parking in seconds"
          type="fade"
          delay={40}
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        />
      </div>

      {/* Phone with screenshot */}
      <div
        style={{
          transform: `translateY(${phoneY}px) scale(${zoomScale})`,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/Map - 1 Main Screen.JPG"
          scale={0.95}
        />
      </div>

      {/* Tap indicator on search button area */}
      <div
        style={{
          position: "absolute",
          bottom: 380,
          left: "50%",
          transform: `translateX(-50%) scale(${tapPulse})`,
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: "4px solid rgba(0,122,255,0.8)",
          backgroundColor: "rgba(0,122,255,0.2)",
          zIndex: 15,
          opacity: interpolate(frame, [80, 90], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
