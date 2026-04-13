import type {
  SpotifyProfile,
  SpotifyTopTracksResponse,
} from "@/lib/spotify-api";
import type { DashboardData } from "@/types/dashboard";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function createDashboardDataFromSpotify(
  profile: SpotifyProfile,
  topTracks: SpotifyTopTracksResponse,
): DashboardData {
  const displayName = profile.display_name ?? profile.id;
  const tracks = topTracks.items.slice(0, 5);

  return {
    metrics: [
      {
        label: "Spotify profile",
        value: displayName,
        delta: profile.product ? `${profile.product} account` : "Connected",
        description: profile.email
          ? `Signed in as ${profile.email}.`
          : "Signed in with your Spotify account.",
      },
      {
        label: "Followers",
        value: formatNumber(profile.followers?.total ?? 0),
        delta: "Live from Spotify",
        description: "Follower count returned by the Spotify Web API.",
      },
      {
        label: "Top tracks",
        value: String(tracks.length),
        delta: "Short-term range",
        description: "Your most-played tracks from the recent listening window.",
      },
    ],
    topTracks: tracks.map((track) => ({
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      plays: `${track.popularity}/100 popularity`,
    })),
  };
}
