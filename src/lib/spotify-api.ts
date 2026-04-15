import {
  SPOTIFY_API_BASE_URL,
  SPOTIFY_TOKEN_URL,
  getSpotifyConfig,
} from "@/lib/spotify";

export type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
};

export type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

export type SpotifyProfile = {
  id: string;
  display_name: string | null;
  images?: SpotifyImage[];
  external_urls?: {
    spotify?: string;
  };
  email?: string;
  product?: string;
  followers?: {
    total: number;
  };
};

export type SpotifyTopTracksResponse = {
  items: Array<{
    id: string;
    name: string;
    duration_ms: number;
    popularity: number;
    album: {
      id?: string;
      name: string;
      images?: SpotifyImage[];
    };
    artists: Array<{
      id?: string;
      name: string;
    }>;
  }>;
};

export type SpotifyTopArtistsResponse = {
  items: Array<{
    id: string;
    name: string;
    images?: SpotifyImage[];
  }>;
};

export type SpotifyRecentlyPlayedItem = {
  played_at: string;
  track: {
    id: string;
    name: string;
    duration_ms: number;
    album: {
      id?: string;
      name: string;
      images?: SpotifyImage[];
    };
    artists: Array<{
      id?: string;
      name: string;
    }>;
  };
};

export type SpotifyRecentlyPlayedResponse = {
  items: SpotifyRecentlyPlayedItem[];
  cursors?: {
    before?: string;
    after?: string;
  };
  next?: string | null;
};

export type SpotifyCurrentlyPlayingResponse = {
  currently_playing_type?: string;
  is_playing: boolean;
  progress_ms?: number;
  item?: {
    id?: string;
    name: string;
    duration_ms: number;
    album: {
      id?: string;
      name: string;
      images?: SpotifyImage[];
    };
    artists: Array<{
      id?: string;
      name: string;
    }>;
  } | null;
};

export type SpotifyTimeRange = "short_term" | "medium_term" | "long_term";

export class SpotifyApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = status;
  }
}

async function parseSpotifyResponse<T>(response: Response) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.error_description ??
      body?.error?.message ??
      body?.error ??
      "Spotify request failed.";

    throw new SpotifyApiError(message, response.status);
  }

  return body as T;
}

export async function exchangeSpotifyCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri?: string,
) {
  const config = getSpotifyConfig({ strict: true });
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri ?? config.redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  return parseSpotifyResponse<SpotifyTokenResponse>(response);
}

export async function refreshSpotifyAccessToken(refreshToken: string) {
  const config = getSpotifyConfig({ strict: true });
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  return parseSpotifyResponse<SpotifyTokenResponse>(response);
}

export async function spotifyFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
) {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  return parseSpotifyResponse<T>(response);
}

export function getCurrentSpotifyProfile(accessToken: string) {
  return spotifyFetch<SpotifyProfile>("/me", accessToken);
}

export function getCurrentUserTopTracks(
  accessToken: string,
  timeRange: SpotifyTimeRange = "short_term",
  limit = 5,
) {
  const query = new URLSearchParams({
    limit: String(limit),
    time_range: timeRange,
  });

  return spotifyFetch<SpotifyTopTracksResponse>(
    `/me/top/tracks?${query.toString()}`,
    accessToken,
  );
}

export function getCurrentUserTopArtists(
  accessToken: string,
  timeRange: SpotifyTimeRange = "short_term",
  limit = 5,
) {
  const query = new URLSearchParams({
    limit: String(limit),
    time_range: timeRange,
  });

  return spotifyFetch<SpotifyTopArtistsResponse>(
    `/me/top/artists?${query.toString()}`,
    accessToken,
  );
}

export function getCurrentUserRecentlyPlayed(
  accessToken: string,
  options: {
    limit?: number;
    before?: number;
  } = {},
) {
  const query = new URLSearchParams({
    limit: String(options.limit ?? 50),
  });

  if (typeof options.before === "number") {
    query.set("before", String(Math.max(0, Math.floor(options.before))));
  }

  return spotifyFetch<SpotifyRecentlyPlayedResponse>(
    `/me/player/recently-played?${query.toString()}`,
    accessToken,
  );
}

export function getCurrentUserCurrentlyPlaying(accessToken: string) {
  return spotifyFetch<SpotifyCurrentlyPlayingResponse | null>(
    "/me/player/currently-playing",
    accessToken,
  );
}
