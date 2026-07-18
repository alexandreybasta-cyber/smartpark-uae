import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { MapScene } from "./scenes/MapScene";
import { ParkingResultsScene } from "./scenes/ParkingResultsScene";
import { SpotDetailScene } from "./scenes/SpotDetailScene";
import { NavigationScene } from "./scenes/NavigationScene";
import { AgentScene } from "./scenes/AgentScene";
import { AgentDetailScene } from "./scenes/AgentDetailScene";
import { SavedPlacesScene } from "./scenes/SavedPlacesScene";
import { InsightsScene } from "./scenes/InsightsScene";
import { EnforcementScene } from "./scenes/EnforcementScene";
import { EnforcementDetailScene } from "./scenes/EnforcementDetailScene";
import { OutroScene } from "./scenes/OutroScene";

const CROSSFADE = 15;

interface SceneConfig {
  component: React.FC;
  start: number;
  duration: number;
}

const scenes: SceneConfig[] = [
  { component: TitleScene, start: 0, duration: 105 },
  { component: MapScene, start: 90, duration: 195 },
  { component: ParkingResultsScene, start: 270, duration: 195 },
  { component: SpotDetailScene, start: 450, duration: 165 },
  { component: NavigationScene, start: 600, duration: 165 },
  { component: AgentScene, start: 750, duration: 225 },
  { component: AgentDetailScene, start: 960, duration: 165 },
  { component: SavedPlacesScene, start: 1110, duration: 165 },
  { component: InsightsScene, start: 1260, duration: 195 },
  { component: EnforcementScene, start: 1440, duration: 195 },
  { component: EnforcementDetailScene, start: 1620, duration: 165 },
  { component: OutroScene, start: 1770, duration: 195 },
];

const CrossfadeScene: React.FC<{
  scene: SceneConfig;
  globalFrame: number;
}> = ({ scene, globalFrame }) => {
  const localFrame = globalFrame - scene.start;
  const SceneComponent = scene.component;

  const fadeIn = interpolate(
    localFrame,
    [0, CROSSFADE],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const fadeOut = interpolate(
    localFrame,
    [scene.duration - CROSSFADE, scene.duration],
    [1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div style={{ opacity, position: "absolute", inset: 0 }}>
      <SceneComponent />
    </div>
  );
};

export const SpotSenseDemo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {scenes.map((scene, i) => {
        const isActive =
          frame >= scene.start &&
          frame < scene.start + scene.duration;

        if (!isActive) return null;

        return (
          <Sequence
            key={i}
            from={scene.start}
            durationInFrames={scene.duration}
          >
            <CrossfadeScene scene={scene} globalFrame={frame} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
