"use client";

import React, { useState } from "react";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaExchangeAlt,
  FaSearch,
  FaHeart,
  FaTrash,
} from "react-icons/fa";
import { ServiceType } from "@/app/types/playerTypes";

// Import atoms
import Button from "@/app/components/atoms/Button";
import Input from "@/app/components/atoms/Input";
import ProgressBar from "@/app/components/atoms/ProgressBar";
import VolumeSlider from "@/app/components/atoms/VolumeSlider";
import ControlButton from "@/app/components/atoms/ControlButton";
import TimeDisplay from "@/app/components/atoms/TimeDisplay";
import ServiceIcon from "@/app/components/atoms/ServiceIcon";
import AlbumArt from "@/app/components/atoms/AlbumArt";
import Loading from "@/app/components/atoms/Loading";

// Import molecules
import SearchBar from "@/app/components/molecules/SearchBar";
import SearchResultItem from "@/app/components/molecules/SearchResultItem";
import PlaylistItem from "@/app/components/molecules/PlaylistItem";
import CrossfadeControls from "@/app/components/molecules/CrossfadeControls";
import DeckLabel from "@/app/components/molecules/DeckLabel";
import VolumeControl from "@/app/components/molecules/VolumeControl";

const AtomicDesignDemo: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(30);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(75);
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
  const [crossfadePercentage, setCrossfadePercentage] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mockSearchResult = {
    id: "demo-1",
    title: "Demo Song - Atomic Design",
    artist: "ReAMP Demo Artist",
    thumbnail: "https://via.placeholder.com/150",
    service: ServiceType.Spotify as ServiceType,
    duration: 180,
  };

  const mockPlaylistItem = {
    id: "playlist-1",
    title: "Demo Playlist Item",
    subtitle: "ReAMP Demo Artist",
    thumbnail: "https://via.placeholder.com/150",
    isPlaying: false,
    isSelected: false,
    isLiked: false,
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#FF6B6B]">
          Atomic Design Demo - ReAMP Styling
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Atoms Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#4ECDC4] mb-6">Atoms</h2>

            {/* Button */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Button</h3>
              <div className="flex gap-4 flex-wrap">
                <Button
                  variant="primary"
                  onClick={() => console.log("Primary clicked")}
                >
                  Primary
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => console.log("Secondary clicked")}
                >
                  Secondary
                </Button>
                <Button
                  variant="spotify"
                  onClick={() => console.log("Spotify clicked")}
                >
                  Spotify
                </Button>
                <Button
                  variant="youtube"
                  onClick={() => console.log("YouTube clicked")}
                >
                  YouTube
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => console.log("Ghost clicked")}
                >
                  Ghost
                </Button>
                <Button
                  variant="danger"
                  onClick={() => console.log("Danger clicked")}
                >
                  Danger
                </Button>
              </div>
            </div>

            {/* Input */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Input</h3>
              <div className="space-y-4">
                <Input
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Enter text..."
                  variant="default"
                />
                <Input
                  value=""
                  onChange={() => {}}
                  placeholder="Search variant..."
                  variant="search"
                />
                <Input
                  value=""
                  onChange={() => {}}
                  placeholder="Ghost variant..."
                  variant="ghost"
                />
              </div>
            </div>

            {/* ProgressBar */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">ProgressBar</h3>
              <div className="space-y-4">
                <ProgressBar
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={setCurrentTime}
                  color="red"
                  showTime
                />
                <ProgressBar
                  currentTime={currentTime}
                  duration={duration}
                  color="teal"
                  height="lg"
                />
              </div>
            </div>

            {/* VolumeSlider */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">VolumeSlider</h3>
              <div className="space-y-4">
                <VolumeSlider
                  volume={volume}
                  onVolumeChange={setVolume}
                  size="md"
                />
                <VolumeSlider
                  volume={volume}
                  onVolumeChange={setVolume}
                  size="lg"
                  showIcon
                />
              </div>
            </div>

            {/* ControlButton */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">ControlButton</h3>
              <div className="flex gap-4 flex-wrap">
                <ControlButton
                  icon={<FaPlay size={16} />}
                  variant="primary"
                  onClick={() => console.log("Play clicked")}
                />
                <ControlButton
                  icon={<FaPause size={16} />}
                  variant="secondary"
                  onClick={() => console.log("Pause clicked")}
                />
                <ControlButton
                  icon={<FaStop size={16} />}
                  variant="danger"
                  onClick={() => console.log("Stop clicked")}
                />
                <ControlButton
                  icon={<FaVolumeUp size={16} />}
                  variant="ghost"
                  onClick={() => console.log("Volume clicked")}
                />
                <ControlButton
                  icon={<FaExchangeAlt size={16} />}
                  variant="dj"
                  active
                  onClick={() => console.log("DJ clicked")}
                />
              </div>
            </div>

            {/* Loading */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Loading</h3>
              <div className="flex gap-4">
                <Loading variant="spinner" size="md" />
                <Loading variant="dots" size="md" />
                <Loading variant="pulse" size="md" />
              </div>
            </div>

            {/* TimeDisplay */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">TimeDisplay</h3>
              <div className="space-y-2">
                <TimeDisplay time={currentTime} format="short" />
                <TimeDisplay time={duration} format="long" showHours />
              </div>
            </div>

            {/* ServiceIcon */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">ServiceIcon</h3>
              <div className="flex gap-4">
                <ServiceIcon service={ServiceType.Spotify} size="lg" />
                <ServiceIcon service={ServiceType.Youtube} size="lg" />
              </div>
            </div>

            {/* AlbumArt */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">AlbumArt</h3>
              <div className="flex gap-4">
                <AlbumArt
                  src="https://via.placeholder.com/150"
                  alt="Demo Album"
                  size="lg"
                />
                <AlbumArt src="" alt="No Image" size="md" />
              </div>
            </div>
          </div>

          {/* Molecules Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#4ECDC4] mb-6">
              Molecules
            </h2>

            {/* SearchBar */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">SearchBar</h3>
              <div className="space-y-4">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Search for songs..."
                  loading={isLoading}
                />
              </div>
            </div>

            {/* SearchResultItem */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">SearchResultItem</h3>
              <div className="space-y-2">
                <SearchResultItem
                  result={mockSearchResult}
                  onAddToPlaylist={() => console.log("Added to playlist")}
                  isInPlaylist={false}
                />
                <SearchResultItem
                  result={{
                    ...mockSearchResult,
                    id: "demo-2",
                    title: "Another Demo Song",
                    service: ServiceType.Youtube,
                  }}
                  onAddToPlaylist={() => console.log("Added to playlist")}
                  isInPlaylist={true}
                />
              </div>
            </div>

            {/* PlaylistItem */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">PlaylistItem</h3>
              <div className="space-y-2">
                <PlaylistItem
                  {...mockPlaylistItem}
                  onPlay={() => console.log("Play clicked")}
                  onPause={() => console.log("Pause clicked")}
                  onSelect={() => console.log("Item selected")}
                  onRemove={() => console.log("Remove clicked")}
                  onLike={() => console.log("Like clicked")}
                  onUnlike={() => console.log("Unlike clicked")}
                />
                <PlaylistItem
                  {...mockPlaylistItem}
                  id="playlist-2"
                  title="Playing Song"
                  isPlaying={true}
                  isSelected={true}
                  isLiked={true}
                  onPlay={() => console.log("Play clicked")}
                  onPause={() => console.log("Pause clicked")}
                  onSelect={() => console.log("Item selected")}
                  onRemove={() => console.log("Remove clicked")}
                  onLike={() => console.log("Like clicked")}
                  onUnlike={() => console.log("Unlike clicked")}
                />
              </div>
            </div>

            {/* CrossfadeControls */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">CrossfadeControls</h3>
              <CrossfadeControls
                enabled={crossfadeEnabled}
                percentage={crossfadePercentage}
                onToggle={() => setCrossfadeEnabled(!crossfadeEnabled)}
                onChange={setCrossfadePercentage}
              />
            </div>

            {/* VolumeControl */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">VolumeControl</h3>
              <VolumeControl
                volume={volume / 100}
                onVolumeChange={(vol) => setVolume(vol * 100)}
                onMute={() => setVolume(0)}
                isMuted={volume === 0}
                showSlider
              />
            </div>

            {/* DeckLabel */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">DeckLabel</h3>
              <div className="space-y-4">
                <DeckLabel playerId="A" variant="default" isActive={true} />
                <DeckLabel playerId="B" variant="compact" />
                <DeckLabel playerId="A" variant="highlighted" />
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="bg-black/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Interactive Demo</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <ControlButton
                    icon={<FaPlay size={16} />}
                    variant="primary"
                    onClick={() =>
                      setCurrentTime((prev) => Math.min(prev + 10, duration))
                    }
                  />
                  <ControlButton
                    icon={<FaPause size={16} />}
                    variant="secondary"
                    onClick={() =>
                      setCurrentTime((prev) => Math.max(prev - 10, 0))
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Click to adjust time
                  </span>
                </div>

                <ProgressBar
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={setCurrentTime}
                  color="red"
                  showTime
                />

                <VolumeSlider
                  volume={volume}
                  onVolumeChange={setVolume}
                  showIcon
                />
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-black/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#FF6B6B] mb-4">
            Updated ReAMP Styling
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-[#4ECDC4] mb-2">Atoms</h3>
              <ul className="space-y-1 text-gray-300">
                <li>
                  • Button: Multiple variants including Spotify/YouTube colors
                </li>
                <li>• Input: ReAMP styling with border and focus states</li>
                <li>• ProgressBar: Simplified without Framer Motion</li>
                <li>• VolumeSlider: Direct input range with color gradients</li>
                <li>• ControlButton: DJ-style controls</li>
                <li>• Loading: CSS animations instead of Framer Motion</li>
                <li>• TimeDisplay: Simple time formatting</li>
                <li>• ServiceIcon: Service type indicators</li>
                <li>• AlbumArt: Album artwork with fallback states</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#4ECDC4] mb-2">Molecules</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• SearchBar: ReAMP search styling with debouncing</li>
                <li>• SearchResultItem: Thumbnail overlay with add buttons</li>
                <li>• PlaylistItem: Spotify-style playlist items</li>
                <li>• CrossfadeControls: DJ crossfade functionality</li>
                <li>• VolumeControl: Advanced volume control</li>
                <li>• DeckLabel: Deck identification in DJ interface</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtomicDesignDemo;
