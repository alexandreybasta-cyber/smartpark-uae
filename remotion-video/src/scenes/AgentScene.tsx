import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const AgentScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftPhoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const leftPhoneX = interpolate(leftPhoneSlide, [0, 1], [-400, 0]);

  const rightPhoneSlide = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const rightPhoneX = interpolate(rightPhoneSlide, [0, 1], [400, 0]);

  const textOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const subtextOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const detailOpacity = interpolate(frame, [80, 100], [0, 1], {
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
      {/* Top title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <AnimatedText
          text="AI Agent"
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
            marginTop: 10,
            opacity: subtextOpacity,
            fontSize: 26,
            color: "#8e8e93",
            fontWeight: 400,
          }}
        >
          Your personal parking assistant
        </div>
      </div>

      {/* Left phone - chat query */}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 280,
          transform: `translateX(${leftPhoneX}px)`,
          zIndex: 10,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/agent_1_chat.jpg"
          scale={0.42}
        />
      </div>

      {/* Center text block */}
      <div
        style={{
          position: "absolute",
          top: 500,
          left: "50%",
          transform: "translateX(-50%)",
          width: 280,
          textAlign: "center",
          zIndex: 20,
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#007AFF",
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Multi-step reasoning
        </div>
        <div
          style={{
            fontSize: 18,
            color: "#e5e5ea",
            lineHeight: 1.6,
          }}
        >
          Understands natural language queries and searches across all connected
          parking zones in real-time.
        </div>
        <div
          style={{
            marginTop: 20,
            opacity: detailOpacity,
            fontSize: 16,
            color: "#8e8e93",
            lineHeight: 1.5,
          }}
        >
          Analyzes availability, pricing, and walking distance to deliver the
          optimal parking recommendation.
        </div>
      </div>

      {/* Right phone - Burj Khalifa results */}
      <div
        style={{
          position: "absolute",
          right: 20,
          top: 280,
          transform: `translateX(${rightPhoneX}px)`,
          zIndex: 10,
        }}
      >
        <PhoneFrame
          imagePath="screenshots/agent_2_burj.jpg"
          scale={0.42}
        />
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [100, 130], [0, 200], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          height: 3,
          backgroundColor: "#007AFF",
          borderRadius: 2,
          opacity: detailOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
