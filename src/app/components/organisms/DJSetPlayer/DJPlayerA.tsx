"use client";

import DJPlayer from "./DJPlayer";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";

interface DJPlayerState {
  service: ServiceType | null;
  song: Song | YoutubeVideo | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  crossfade: number;
}

interface DJPlayerAProps {
  playerState: DJPlayerState;
  onStateChange: (newState: Partial<DJPlayerState>) => void;
  onClear: () => void;
  isActive: boolean;
}

export default function DJPlayerA(props: DJPlayerAProps) {
  return <DJPlayer playerId="A" {...props} />;
}
