import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

interface PhoneFrameProps {
  imagePath: string;
  style?: React.CSSProperties;
  scale?: number;
  zoom?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  imagePath,
  style = {},
  scale = 1,
  zoom = 1,
}) => {
  return (
    <div
      style={{
        position: "relative",
        width: 860 * scale,
        height: 1760 * scale,
        borderRadius: 60 * scale,
        overflow: "hidden",
        backgroundColor: "#000",
        boxShadow: `0 ${40 * scale}px ${80 * scale}px rgba(0,0,0,0.6)`,
        border: `${8 * scale}px solid #1a1a1a`,
        transform: `scale(${zoom})`,
        ...style,
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 300 * scale,
          height: 50 * scale,
          backgroundColor: "#000",
          borderRadius: `0 0 ${25 * scale}px ${25 * scale}px`,
          zIndex: 10,
        }}
      />
      {/* Screen content */}
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(imagePath)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  );
};
