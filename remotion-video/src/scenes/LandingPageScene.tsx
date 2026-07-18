import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";

const STATS = [
  { value: "$11", label: "per sensor" },
  { value: "24 GHz", label: "mmWave" },
  { value: "0.4W", label: "solar" },
  { value: "Six", label: "agents" },
];

export const LandingPageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const headlineY = interpolate(frame, [0, 25], [40, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const urlBarScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const urlOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const accentWidth = interpolate(frame, [50, 80], [0, 400], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.15, 0.4]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, #007AFF22 0%, transparent 70%)",
          opacity: glowPulse,
        }}
      />

      {/* URL bar badge */}
      <div
        style={{
          position: "absolute",
          top: 200,
          transform: `scale(${urlBarScale})`,
          opacity: urlOpacity,
          backgroundColor: "rgba(28,28,30,0.9)",
          borderRadius: 16,
          padding: "14px 32px",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#34C759",
            }}
          />
          <span style={{ fontSize: 28, color: "#e5e5ea", fontWeight: 500 }}>
            spotsense.app
          </span>
        </div>
      </div>

      {/* Main headline */}
      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          textAlign: "center",
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: -2,
            textShadow: "0 0 60px rgba(0,122,255,0.4)",
            lineHeight: 1.1,
          }}
        >
          Every curb,
          <br />
          self-aware.
        </div>
      </div>

      {/* Accent line */}
      <div
        style={{
          marginTop: 40,
          width: accentWidth,
          height: 3,
          backgroundColor: "#007AFF",
          borderRadius: 2,
        }}
      />

      {/* Stats grid */}
      <div
        style={{
          position: "absolute",
          bottom: 400,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-around",
          zIndex: 20,
        }}
      >
        {STATS.map((stat, i) => {
          const statDelay = 70 + i * 15;
          const statOpacity = interpolate(frame - statDelay, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const statY = interpolate(frame - statDelay, [0, 15], [30, 0], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });

          return (
            <div
              key={stat.label}
              style={{
                opacity: statOpacity,
                transform: `translateY(${statY}px)`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#007AFF",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: "#8e8e93",
                  marginTop: 8,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [120, 140], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
        }}
      >
        <AnimatedText
          text="spotsense.app"
          type="typewriter"
          delay={120}
          duration={20}
          style={{
            fontSize: 36,
            color: "#007AFF",
            fontWeight: 600,
            letterSpacing: 3,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
