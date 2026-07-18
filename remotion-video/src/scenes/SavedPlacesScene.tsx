import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { AnimatedText } from "../components/AnimatedText";

const SavedPlacesList: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [500, 0]);
  const itemDelays = [20, 35, 50];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
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
          delay={15}
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        />
      </div>

      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <PhoneFrame
          imagePath="screenshots/Saved Places 1.PNG.JPG"
          scale={0.95}
        />
      </div>

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
    </AbsoluteFill>
  );
};

const NotificationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [500, 0]);

  const notificationSlideY = interpolate(frame, [10, 35], [-200, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const notificationOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const textOpacity = interpolate(frame, [30, 50], [0, 1], {
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
          text="Your spot finds you"
          type="fade"
          delay={30}
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        />
        <div
          style={{
            marginTop: 12,
            opacity: interpolate(frame, [50, 70], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
            fontSize: 24,
            color: "#8e8e93",
            fontWeight: 400,
          }}
        >
          Smart proximity alerts within 500m of saved places
        </div>
      </div>

      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <PhoneFrame
          imagePath="screenshots/joint_image_3_notification.png"
          scale={0.95}
        />
      </div>

      {/* Notification banner overlay sliding from top */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 100,
          right: 100,
          transform: `translateY(${notificationSlideY}px)`,
          opacity: notificationOpacity,
          zIndex: 25,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(28,28,30,0.95)",
            borderRadius: 20,
            padding: "20px 28px",
            border: "1px solid rgba(52,199,89,0.4)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "#34C759",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            P
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
              Free Parking Found
            </div>
            <div style={{ fontSize: 20, color: "#8e8e93", marginTop: 4 }}>
              Free spot 30m from school. Tap to navigate.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SavedPlacesScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <Sequence from={0} durationInFrames={90}>
        <SavedPlacesList />
      </Sequence>
      <Sequence from={75} durationInFrames={120}>
        <NotificationScene />
      </Sequence>
    </AbsoluteFill>
  );
};
