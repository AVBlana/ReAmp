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

interface DJPlayerBProps {
  playerState: DJPlayerState;
  onStateChange: (newState: Partial<DJPlayerState>) => void;
  onClear: () => void;
  isActive: boolean;
}

export default function DJPlayerB(props: DJPlayerBProps) {
  return <DJPlayer playerId="B" {...props} />;
}
