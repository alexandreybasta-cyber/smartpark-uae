import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

const COLUMNS = [
  { label: "EDGE", text: "mmWave sensors at every bay", color: "#34C759" },
  { label: "CLOUD", text: "Connected to city parking systems", color: "#007AFF" },
  { label: "REASONING", text: "AI analyzes, predicts, and acts", color: "#FF9500" },
  { label: "CITY", text: "From cameras to payment APIs to patrol dispatch", color: "#AF52DE" },
];

export const HowItWorksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const imageSlideUp = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const imageY = interpolate(imageSlideUp, [0, 1], [300, 0]);
  const imageOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const finalTextOpacity = interpolate(frame, [140, 160], [0, 1], {
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
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 20,
          opacity: titleOpacity,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>
          How SpotSense Works
        </div>
        <div style={{ fontSize: 26, color: "#8e8e93", marginTop: 8 }}>
          Six agents. One curb.
        </div>
      </div>

      {/* Architecture diagram image */}
      <div
        style={{
          transform: `translateY(${imageY}px)`,
          opacity: imageOpacity,
          marginTop: 40,
          width: 900,
          height: 500,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <Img
          src={staticFile("screenshots/joint_image_4_architecture.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Sequential column highlights */}
      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-around",
          zIndex: 20,
        }}
      >
        {COLUMNS.map((col, i) => {
          const colDelay = 40 + i * 25;
          const colOpacity = interpolate(frame - colDelay, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const colY = interpolate(frame - colDelay, [0, 15], [20, 0], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });

          return (
            <div
              key={col.label}
              style={{
                opacity: colOpacity,
                transform: `translateY(${colY}px)`,
                textAlign: "center",
                flex: 1,
                padding: "0 8px",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: col.color,
                  letterSpacing: 2,
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                {col.label}
              </div>
              <div style={{ fontSize: 16, color: "#e5e5ea", lineHeight: 1.3 }}>
                {col.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Final summary text */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 80,
          right: 80,
          textAlign: "center",
          opacity: finalTextOpacity,
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#8e8e93",
            lineHeight: 1.5,
          }}
        >
          Our AI Agent connects to city infrastructure, analyzes patterns,
          predicts availability, and delivers it all to your phone.
        </div>
      </div>
    </AbsoluteFill>
  );
};
