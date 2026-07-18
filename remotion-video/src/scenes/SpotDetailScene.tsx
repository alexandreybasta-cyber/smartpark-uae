import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const SpotDetailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [500, 0]);

  const zoomScale = interpolate(frame, [40, 120], [1, 1.2], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const freePulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [1, 1.15]);

  const tapOpacity = interpolate(frame, [80, 95], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const tapScale = interpolate(Math.sin(frame * 0.25), [-1, 1], [0.9, 1.1]);

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
          text="One tap to navigate"
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
      <div
        style={{
          transform: `translateY(${phoneY}px) scale(${zoomScale})`,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/Map - 3 after clicking on a parking lot.JPG"
          scale={0.95}
        />
      </div>

      {/* Free badge pulse overlay */}
      <div
        style={{
          position: "absolute",
          top: 580,
          right: 140,
          backgroundColor: "#34C759",
          borderRadius: 12,
          padding: "8px 24px",
          transform: `scale(${freePulse})`,
          opacity: interpolate(frame, [50, 65], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          zIndex: 20,
          boxShadow: "0 0 30px rgba(52,199,89,0.6)",
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>
          FREE
        </span>
      </div>

      {/* Navigate tap indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: "50%",
          transform: `translateX(-50%) scale(${tapScale})`,
          width: 240,
          height: 60,
          borderRadius: 16,
          border: "3px solid rgba(0,122,255,0.8)",
          backgroundColor: "rgba(0,122,255,0.15)",
          zIndex: 15,
          opacity: tapOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
