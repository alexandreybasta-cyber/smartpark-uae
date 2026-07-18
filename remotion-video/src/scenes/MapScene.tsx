import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

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
          text="One tap to search"
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

      {/* Phone with screenshot - zoom applied via prop */}
      <div
        style={{
          transform: `translateY(${phoneY}px)`,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/Map - 1 Main Screen.JPG"
          scale={0.95}
          zoom={zoomScale}
        />
      </div>
    </AbsoluteFill>
  );
};
