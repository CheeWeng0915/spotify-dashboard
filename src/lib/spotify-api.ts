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

export type SpotifyRecommendationsResponse = {
  tracks: Array<{
    id: string;
    name: string;
    duration_ms: number;
    preview_url?: string | null;
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

export type SpotifyArtistTopTracksResponse = {
  tracks: Array<{
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

export type SpotifySearchTracksResponse = {
  tracks: {
    items: Array<{
      id: string;
      uri: string;
      name: string;
      duration_ms: number;
      popularity: number;
      external_urls?: {
        spotify?: string;
      };
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
};

export type SpotifySearchType = "track" | "artist" | "album" | "show" | "episode";

type SpotifyExternalUrls = {
  spotify?: string;
};

export type SpotifySearchCatalogResponse = {
  tracks?: {
    items: Array<{
      id: string;
      uri?: string;
      name: string;
      duration_ms: number;
      external_urls?: SpotifyExternalUrls;
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
  artists?: {
    items: Array<{
      id: string;
      uri?: string;
      name: string;
      images?: SpotifyImage[];
      external_urls?: SpotifyExternalUrls;
    }>;
  };
  albums?: {
    items: Array<{
      id: string;
      uri?: string;
      name: string;
      images?: SpotifyImage[];
      external_urls?: SpotifyExternalUrls;
      artists: Array<{
        id?: string;
        name: string;
      }>;
      release_date?: string;
    }>;
  };
  shows?: {
    items: Array<{
      id: string;
      uri?: string;
      name: string;
      publisher?: string;
      images?: SpotifyImage[];
      external_urls?: SpotifyExternalUrls;
      total_episodes?: number;
    }>;
  };
  episodes?: {
    items: Array<{
      id: string;
      uri?: string;
      name: string;
      description?: string;
      duration_ms?: number;
      images?: SpotifyImage[];
      external_urls?: SpotifyExternalUrls;
      show?: {
        name?: string;
        publisher?: string;
      };
    }>;
  };
};

export type SpotifyPlaylistSummaryItem = {
  id: string;
  name: string;
  uri: string;
  snapshot_id?: string;
  collaborative?: boolean;
  public?: boolean | null;
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
  owner?: {
    id?: string;
    display_name?: string | null;
  };
  tracks?: {
    total: number;
  };
};

export type SpotifyPlaylistItemsMutationResponse = {
  snapshot_id: string;
};

export type SpotifyCurrentUserPlaylistsResponse = {
  items: SpotifyPlaylistSummaryItem[];
  next?: string | null;
  total?: number;
};

export type SpotifyPlaylistDetailsResponse = SpotifyPlaylistSummaryItem;

export type SpotifyPlaylistItemObject = {
  id?: string | null;
  uri?: string | null;
  type?: string;
  name?: string;
  duration_ms?: number | null;
  is_local?: boolean;
  external_urls?: SpotifyExternalUrls;
  album?: {
    id?: string;
    name: string;
    images?: SpotifyImage[];
  };
  artists?: Array<{
    id?: string;
    name: string;
  }>;
  images?: SpotifyImage[];
  show?: {
    id?: string;
    name?: string;
    publisher?: string;
    images?: SpotifyImage[];
  };
};

export type SpotifyPlaylistItemsResponse = {
  items: Array<{
    added_at?: string | null;
    track: SpotifyPlaylistItemObject | null;
  }>;
  next?: string | null;
  total?: number;
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
    cache: "no-store",
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

export function getSpotifyRecommendations(
  accessToken: string,
  options: {
    seedArtists?: string[];
    seedTracks?: string[];
    seedGenres?: string[];
    limit?: number;
  } = {},
) {
  const seedArtists = (options.seedArtists ?? []).filter(Boolean).slice(0, 5);
  const seedTracks = (options.seedTracks ?? []).filter(Boolean).slice(0, 5);
  const seedGenres = (options.seedGenres ?? []).filter(Boolean).slice(0, 5);
  const totalSeedCount = seedArtists.length + seedTracks.length + seedGenres.length;

  if (totalSeedCount === 0) {
    return Promise.resolve<SpotifyRecommendationsResponse>({
      tracks: [],
    });
  }

  const query = new URLSearchParams({
    limit: String(Math.max(1, Math.min(options.limit ?? 20, 100))),
  });

  if (seedArtists.length > 0) {
    query.set("seed_artists", seedArtists.join(","));
  }

  if (seedTracks.length > 0) {
    query.set("seed_tracks", seedTracks.join(","));
  }

  if (seedGenres.length > 0) {
    query.set("seed_genres", seedGenres.join(","));
  }

  return spotifyFetch<SpotifyRecommendationsResponse>(
    `/recommendations?${query.toString()}`,
    accessToken,
  );
}

export function getArtistTopTracks(
  accessToken: string,
  artistId: string,
  market = "US",
) {
  const query = new URLSearchParams({
    market,
  });

  return spotifyFetch<SpotifyArtistTopTracksResponse>(
    `/artists/${encodeURIComponent(artistId)}/top-tracks?${query.toString()}`,
    accessToken,
  );
}

export function searchSpotifyTracks(
  accessToken: string,
  queryText: string,
  options: {
    limit?: number;
    market?: string;
  } = {},
) {
  const query = new URLSearchParams({
    q: queryText,
    type: "track",
    limit: String(Math.max(1, Math.min(options.limit ?? 20, 50))),
  });

  if (options.market) {
    query.set("market", options.market);
  }

  return spotifyFetch<SpotifySearchTracksResponse>(
    `/search?${query.toString()}`,
    accessToken,
  );
}

export function searchSpotifyCatalog(
  accessToken: string,
  queryText: string,
  types: SpotifySearchType[],
  options: {
    limit?: number;
    market?: string;
  } = {},
) {
  const query = new URLSearchParams({
    q: queryText,
    type: Array.from(new Set(types)).join(","),
    limit: String(Math.max(1, Math.min(options.limit ?? 10, 50))),
  });

  if (options.market) {
    query.set("market", options.market);
  }

  return spotifyFetch<SpotifySearchCatalogResponse>(
    `/search?${query.toString()}`,
    accessToken,
  );
}

export function getCurrentUserPlaylists(
  accessToken: string,
  options: {
    limit?: number;
    offset?: number;
  } = {},
) {
  const query = new URLSearchParams({
    limit: String(Math.max(1, Math.min(options.limit ?? 50, 50))),
    offset: String(Math.max(0, Math.floor(options.offset ?? 0))),
  });

  return spotifyFetch<SpotifyCurrentUserPlaylistsResponse>(
    `/me/playlists?${query.toString()}`,
    accessToken,
  );
}

export function getSpotifyPlaylist(accessToken: string, playlistId: string) {
  return spotifyFetch<SpotifyPlaylistDetailsResponse>(
    `/playlists/${encodeURIComponent(playlistId)}`,
    accessToken,
  );
}

export function getSpotifyPlaylistItems(
  accessToken: string,
  playlistId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {},
) {
  const query = new URLSearchParams({
    limit: String(Math.max(1, Math.min(options.limit ?? 50, 50))),
    offset: String(Math.max(0, Math.floor(options.offset ?? 0))),
  });

  return spotifyFetch<SpotifyPlaylistItemsResponse>(
    `/playlists/${encodeURIComponent(playlistId)}/tracks?${query.toString()}`,
    accessToken,
  );
}

export function addItemsToSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
) {
  return spotifyFetch<SpotifyPlaylistItemsMutationResponse>(
    `/playlists/${encodeURIComponent(playlistId)}/tracks`,
    accessToken,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
    },
  );
}

export async function replaceSpotifyPlaylistItems(
  accessToken: string,
  playlistId: string,
  uris: string[],
) {
  const firstBatch = uris.slice(0, 100);
  let mutation = await spotifyFetch<SpotifyPlaylistItemsMutationResponse>(
    `/playlists/${encodeURIComponent(playlistId)}/tracks`,
    accessToken,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: firstBatch }),
    },
  );

  for (let index = 100; index < uris.length; index += 100) {
    mutation = await addItemsToSpotifyPlaylist(
      accessToken,
      playlistId,
      uris.slice(index, index + 100),
    );
  }

  return mutation;
}
