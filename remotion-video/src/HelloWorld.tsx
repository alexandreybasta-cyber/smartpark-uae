import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const HelloWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = Math.min(1, frame / (fps * 0.5));

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0b0b0b",
      }}
    >
      <h1
        style={{
          color: "#ffffff",
          fontSize: 80,
          fontWeight: 700,
          opacity,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        SpotSense
      </h1>
      <p
        style={{
          color: "#888888",
          fontSize: 28,
          marginTop: 12,
          opacity,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Video placeholder — replace with your composition
      </p>
    </AbsoluteFill>
  );
};
