import React from "react";
import { Composition } from "remotion";
import { SpotSenseDemo } from "./SpotSenseDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpotSenseDemo"
        component={SpotSenseDemo}
        durationInFrames={2100}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
