import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface AnimatedTextProps {
  text: string;
  style?: React.CSSProperties;
  type?: "typewriter" | "fade";
  delay?: number;
  duration?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  style = {},
  type = "fade",
  delay = 0,
  duration = 30,
}) => {
  const frame = useCurrentFrame();

  if (type === "typewriter") {
    const charsToShow = Math.floor(
      interpolate(frame - delay, [0, duration], [0, text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );

    return (
      <div style={{ ...style }}>
        {text.split("").map((char, i) => (
          <span
            key={i}
            style={{
              opacity: i < charsToShow ? 1 : 0,
              display: "inline",
            }}
          >
            {char}
          </span>
        ))}
        <span
          style={{
            opacity: frame > delay && charsToShow < text.length ? 1 : 0,
            display: "inline",
            animation: "none",
          }}
        >
          |
        </span>
      </div>
    );
  }

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(frame - delay, [0, 20], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
