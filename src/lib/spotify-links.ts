const SPOTIFY_WEB_BASE_URL = "https://open.spotify.com";

function createSpotifySearchUrl(parts: string[]) {
  const query = parts.map((part) => part.trim()).filter(Boolean).join(" ");
  return `${SPOTIFY_WEB_BASE_URL}/search/${encodeURIComponent(query)}`;
}

export function getSpotifyTrackPageUrl(title: string, artist: string) {
  return createSpotifySearchUrl([title, artist]);
}

export function getSpotifyArtistPageUrl(name: string) {
  return createSpotifySearchUrl([name]);
}

export function getSpotifyAlbumPageUrl(title: string, artist: string) {
  return createSpotifySearchUrl([title, artist]);
}
