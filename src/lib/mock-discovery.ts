import type { DiscoveryData } from "@/types/discovery";

export function getMockDiscoveryData(): DiscoveryData {
  return {
    generatedAt: new Date("2026-01-01T12:00:00.000Z").toISOString(),
    profileName: "Spotify Sample Listener",
    tracks: [
      {
        id: "mock-track-1",
        title: "Sunset Drive",
        artist: "Neon Harbor",
        album: "City Lights",
        reason: "Based on your top artists",
      },
      {
        id: "mock-track-2",
        title: "After Rain",
        artist: "Midnight Choir",
        album: "Skyline Stories",
        reason: "Similar to your recent favorites",
      },
    ],
    artists: [
      {
        id: "mock-artist-1",
        name: "Neon Harbor",
        reason: "Fans of your top tracks also play this",
      },
      {
        id: "mock-artist-2",
        name: "Midnight Choir",
        reason: "Recommended from your listening profile",
      },
    ],
  };
}
