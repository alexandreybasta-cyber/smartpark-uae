import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const SavedPlacesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [500, 0]);

  const btnPulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.95, 1.05]);

  const itemDelays = [30, 45, 60, 75];

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
          text="Your places, always ready"
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
      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <PhoneFrame
          imagePath="screenshots/Saved Places 1.PNG.JPG"
          scale={0.95}
        />
      </div>

      {/* Staggered list item highlight overlays */}
      {itemDelays.map((delay, i) => {
        const itemOpacity = interpolate(frame - delay, [0, 15], [0, 0.3], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        });
        const itemY = interpolate(frame - delay, [0, 15], [30, 0], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 380 + i * 120,
              left: 130,
              right: 130,
              height: 100,
              backgroundColor: "rgba(0,122,255,0.15)",
              borderRadius: 16,
              opacity: itemOpacity,
              transform: `translateY(${itemY}px)`,
              zIndex: 15,
            }}
          />
        );
      })}

      {/* Pulsing Find Parking buttons */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 410 + i * 120,
            right: 160,
            backgroundColor: "rgba(0,122,255,0.8)",
            borderRadius: 12,
            padding: "8px 16px",
            transform: `scale(${btnPulse})`,
            opacity: interpolate(frame, [60 + i * 15, 75 + i * 15], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
            zIndex: 20,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
            Find Parking
          </span>
        </div>
      ))}
    </AbsoluteFill>
  );
};
