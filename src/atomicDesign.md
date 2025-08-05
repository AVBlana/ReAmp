src/
├── components/
│ ├── atoms/
│ │ ├── Button/
│ │ │ ├── index.tsx
│ │ │ └── Button.tsx
│ │ ├── Icon/
│ │ │ ├── index.tsx
│ │ │ └── Icon.tsx
│ │ ├── Input/
│ │ │ ├── index.tsx
│ │ │ └── Input.tsx
│ │ └── Loading/
│ │ ├── index.tsx
│ │ └── Loading.tsx
│ ├── molecules/
│ │ ├── SearchBar/
│ │ │ ├── index.tsx
│ │ │ └── SearchBar.tsx
│ │ ├── PlayerControls/
│ │ │ ├── index.tsx
│ │ │ └── PlayerControls.tsx
│ │ ├── VolumeControl/
│ │ │ ├── index.tsx
│ │ │ └── VolumeControl.tsx
│ │ └── PlaylistItem/
│ │ ├── index.tsx
│ │ └── PlaylistItem.tsx
│ ├── organisms/
│ │ ├── Header/
│ │ │ ├── index.tsx
│ │ │ └── Header.tsx
│ │ ├── DJSetPlayer/
│ │ │ ├── index.tsx
│ │ │ ├── DJPlayer.tsx
│ │ │ ├── DJPlayerA.tsx
│ │ │ ├── DJPlayerB.tsx
│ │ │ ├── VinylPlayer.tsx
│ │ │ └── PlayerDropZone.tsx
│ │ ├── UnifiedSearch/
│ │ │ ├── index.tsx
│ │ │ └── UnifiedSearch.tsx
│ │ ├── UnifiedPlaylistView/
│ │ │ ├── index.tsx
│ │ │ ├── UnifiedPlaylistView.tsx
│ │ │ └── PlaylistItem.tsx (UnifiedPlaylistItem)
│ │ ├── UnifiedPlaylistLibrary/
│ │ │ ├── index.tsx
│ │ │ └── UnifiedPlaylistLibrary.tsx
│ │ └── SpotifyAuthCheck/
│ │ ├── index.tsx
│ │ └── SpotifyAuthCheck.tsx
│ └── templates/
│ └── ReAMPLayout/
│ ├── index.tsx
│ └── ReAMPLayout.tsx
├── services/
│ ├── api/
│ │ ├── spotify/
│ │ │ ├── callback/
│ │ │ │ └── route.ts
│ │ │ ├── login/
│ │ │ │ └── route.ts
│ │ │ ├── logout/
│ │ │ │ └── route.ts
│ │ │ ├── refresh/
│ │ │ │ └── route.ts
│ │ │ └── search/
│ │ │ └── route.ts
│ │ └── youtube/
│ │ └── route.tsx
│ └── managers/
│ ├── SpotifyPlayerManager/
│ │ ├── index.ts
│ │ └── SpotifyPlayerManager.ts
│ └── YouTubePlayerManager/
│ ├── index.ts
│ └── YouTubePlayerManager.ts
├── hooks/
│ ├── useCrossfade/
│ │ ├── index.ts
│ │ └── useCrossfade.ts
│ ├── usePlayerControls/
│ │ ├── index.ts
│ │ └── usePlayerControls.ts
│ └── useSpotifyPlayer/
│ ├── index.ts
│ └── useSpotifyPlayer.ts
├── types/
│ ├── playerTypes.ts
│ ├── spotifyTypes.ts
│ └── youtubeTypes.ts
├── context/
│ └── UnifiedContext/
│ ├── index.ts
│ └── UnifiedContext.tsx
└── utils/
└── helpers/
└── index.ts
