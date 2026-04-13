import type { DashboardData } from "@/types/dashboard";

export function getMockDashboardData(): DashboardData {
  return {
    metrics: [
      {
        label: "Monthly listeners",
        value: "128.4K",
        delta: "+8.6% this month",
        description: "Snapshot of your current audience growth across Spotify.",
      },
      {
        label: "Streams",
        value: "2.9M",
        delta: "+14.2% this month",
        description: "Total stream count for the last rolling 30-day window.",
      },
      {
        label: "Playlist adds",
        value: "4,182",
        delta: "+5.4% this month",
        description: "How often listeners saved tracks into their playlists.",
      },
    ],
    topTracks: [
      {
        title: "Northern Lights",
        artist: "Sora Vale",
        album: "Static Bloom",
        plays: "482K",
      },
      {
        title: "Afterglow Avenue",
        artist: "Lumen Street",
        album: "Night Transit",
        plays: "391K",
      },
      {
        title: "Deep Blue Echo",
        artist: "Atlas Hotel",
        album: "Tide Signals",
        plays: "327K",
      },
    ],
  };
}
