import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SceneTransitionProps {
  children: React.ReactNode;
  type?: "fadeIn" | "slideLeft" | "slideRight" | "slideUp";
  duration?: number;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  children,
  type = "fadeIn",
  duration = 20,
}) => {
  const frame = useCurrentFrame();

  const opacity =
    type === "fadeIn"
      ? interpolate(frame, [0, duration], [0, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

  const translateX =
    type === "slideLeft"
      ? interpolate(frame, [0, duration], [200, 0], {
          extrapolateRight: "clamp",
        })
      : type === "slideRight"
        ? interpolate(frame, [0, duration], [-200, 0], {
            extrapolateRight: "clamp",
          })
        : 0;

  const translateY =
    type === "slideUp"
      ? interpolate(frame, [0, duration], [150, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px) translateY(${translateY}px)`,
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
};
