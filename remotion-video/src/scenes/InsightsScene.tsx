import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

export const InsightsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [500, 0]);

  const occupancy1 = Math.floor(
    interpolate(frame, [50, 100], [0, 87], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const occupancy2 = Math.floor(
    interpolate(frame, [60, 110], [0, 64], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const occupancy3 = Math.floor(
    interpolate(frame, [70, 120], [0, 42], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const barWidth1 = interpolate(frame, [50, 100], [0, 87], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const barWidth2 = interpolate(frame, [60, 110], [0, 64], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const barWidth3 = interpolate(frame, [70, 120], [0, 42], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const chartDrawProgress = interpolate(frame, [40, 120], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const overlayOpacity = interpolate(frame, [45, 65], [0, 1], {
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
          text="Predictive analytics"
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
          imagePath="screenshots/Insights 1.PNG.JPG"
          scale={0.95}
        />
      </div>

      {/* Chart line draw animation overlay */}
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 160,
          right: 160,
          height: 200,
          zIndex: 15,
          opacity: overlayOpacity,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 700 200">
          <polyline
            points="0,180 100,140 200,160 300,80 400,100 500,40 600,60 700,20"
            fill="none"
            stroke="#007AFF"
            strokeWidth="4"
            strokeDasharray="2000"
            strokeDashoffset={2000 * (1 - chartDrawProgress)}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 8px rgba(0,122,255,0.6))" }}
          />
        </svg>
      </div>

      {/* Occupancy stats overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 250,
          left: 80,
          right: 80,
          zIndex: 20,
          opacity: overlayOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(28,28,30,0.95)",
            borderRadius: 24,
            padding: "24px 32px",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          {[
            { label: "Zone A", value: occupancy1, bar: barWidth1, color: "#FF3B30" },
            { label: "Zone B", value: occupancy2, bar: barWidth2, color: "#FF9500" },
            { label: "Zone C", value: occupancy3, bar: barWidth3, color: "#34C759" },
          ].map((zone, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 16 : 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 24, color: "#e5e5ea" }}>
                  {zone.label}
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: zone.color }}>
                  {zone.value}%
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${zone.bar}%`,
                    backgroundColor: zone.color,
                    borderRadius: 5,
                    boxShadow: `0 0 12px ${zone.color}66`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
