import type { SpotifyCurrentlyPlayingResponse } from "@/lib/spotify-api";
import type { NowPlayingTrack } from "@/types/dashboard";

function pickImageUrl(images: Array<{ url: string }> | undefined): string | undefined {
  return images?.[0]?.url;
}

export function createNowPlayingTrack(
  currentlyPlaying: SpotifyCurrentlyPlayingResponse | null | undefined,
): NowPlayingTrack | undefined {
  if (!currentlyPlaying || currentlyPlaying.currently_playing_type !== "track") {
    return undefined;
  }

  if (!currentlyPlaying.item) {
    return undefined;
  }

  return {
    title: currentlyPlaying.item.name,
    artist: currentlyPlaying.item.artists.map((artist) => artist.name).join(", "),
    album: currentlyPlaying.item.album.name,
    imageUrl: pickImageUrl(currentlyPlaying.item.album.images),
    isPlaying: currentlyPlaying.is_playing,
    progressMs: currentlyPlaying.progress_ms,
    durationMs: currentlyPlaying.item.duration_ms,
  };
}
