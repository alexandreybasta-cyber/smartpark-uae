import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";
import { PulsingDot } from "../components/PulsingDot";

export const ParkingResultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideProgress = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const imageSlideX = interpolate(slideProgress, [0, 1], [860, 0]);
  const oldImageSlideX = interpolate(slideProgress, [0, 1], [0, -860]);

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [600, 0]);

  const counterValue = Math.floor(
    interpolate(frame, [30, 60], [0, 7], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const counterOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const textOpacity = interpolate(frame, [15, 35], [0, 1], {
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
          text="Instant results"
          type="fade"
          delay={15}
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        />
      </div>

      {/* Phone with seamless slide transition */}
      <div
        style={{
          transform: `translateY(${phoneY}px)`,
          position: "relative",
          width: 860 * 0.95,
          height: 1760 * 0.95,
          borderRadius: 60 * 0.95,
          overflow: "hidden",
        }}
      >
        {/* Old image sliding out to left */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${oldImageSlideX}px)`,
          }}
        >
          <PhoneFrame
            imagePath="screenshots/Map - 1 Main Screen.JPG"
            scale={0.95}
            style={{ borderRadius: 0, border: "none", boxShadow: "none" }}
          />
        </div>
        {/* New image sliding in from right */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${imageSlideX}px)`,
          }}
        >
          <PhoneFrame
            imagePath="screenshots/joint_image_2_parking_found.png"
            scale={0.95}
            style={{ borderRadius: 0, border: "none", boxShadow: "none" }}
          />
        </div>
        {/* Phone bezel overlay (notch) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 300 * 0.95,
            height: 50 * 0.95,
            backgroundColor: "#000",
            borderRadius: `0 0 ${25 * 0.95}px ${25 * 0.95}px`,
            zIndex: 10,
          }}
        />
      </div>

      {/* Pulsing green dots overlay */}
      <PulsingDot x={320} y={650} color="#34C759" size={20} delay={40} />
      <PulsingDot x={480} y={580} color="#34C759" size={20} delay={45} />
      <PulsingDot x={600} y={720} color="#34C759" size={20} delay={50} />

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
