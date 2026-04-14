type SpotifyConfig = {
  clientId: string;
  hasClientSecret: boolean;
  appUrl: string;
  isConfigured: boolean;
  redirectUri: string;
};

import { getMockDashboardData } from "@/lib/mock-dashboard";
import type { DashboardData, TopTrack } from "@/types/dashboard";

export const SPOTIFY_AUTH_STATE_COOKIE = "spotify_auth_state";
export const SPOTIFY_SESSION_COOKIE = "spotify_session";

const spotifyScopes = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-library-read",
];

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export type SpotifySession = {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt: number;
  refreshToken?: string;
};

type SpotifyImage = {
  url: string;
};

type SpotifyProfile = {
  display_name?: string;
  email?: string;
  external_urls?: {
    spotify?: string;
  };
  followers?: {
    total?: number;
  };
  images?: SpotifyImage[];
  product?: string;
};

type SpotifyTrack = {
  name: string;
  popularity?: number;
  external_urls?: {
    spotify?: string;
  };
  album: {
    name: string;
    images?: SpotifyImage[];
  };
  artists: Array<{
    name: string;
  }>;
};

type SpotifyTopTracksResponse = {
  items: SpotifyTrack[];
};

type SpotifySavedTracksResponse = {
  total: number;
};

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
}

export function isSpotifyConfigured() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
  );
}

export function getSpotifyConfig(): SpotifyConfig {
  return {
    clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
    hasClientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
    appUrl: getAppUrl(),
    isConfigured: isSpotifyConfigured(),
    redirectUri: `${getAppUrl()}/api/auth/callback/spotify`,
  };
}

export function getSpotifyScopes() {
  return spotifyScopes.join(" ");
}

export function createSpotifyAuthState() {
  return crypto.randomUUID();
}

export function buildSpotifyAuthorizeUrl(state: string) {
  const config = getSpotifyConfig();
  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");

  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", getSpotifyScopes());

  return authorizeUrl;
}

export function serializeSpotifySession(session: SpotifySession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function parseSpotifySession(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as SpotifySession;
  } catch {
    return null;
  }
}

export function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function exchangeCodeForSpotifySession(code: string) {
  const config = getSpotifyConfig();
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${config.clientId}:${process.env.SPOTIFY_CLIENT_SECRET ?? ""}`,
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed with ${response.status}`);
  }

  const token = (await response.json()) as SpotifyTokenResponse;

  return {
    accessToken: token.access_token,
    tokenType: token.token_type,
    scope: token.scope,
    expiresAt: Date.now() + token.expires_in * 1000,
    refreshToken: token.refresh_token,
  } satisfies SpotifySession;
}

async function fetchSpotify<T>(session: SpotifySession, path: string) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Spotify API request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

function buildFallbackDashboard(message: string, isConfigured = isSpotifyConfigured()) {
  const data = getMockDashboardData();

  return {
    ...data,
    connection: {
      ...data.connection,
      isConfigured,
      message,
    },
  };
}

export async function getDashboardData(session: SpotifySession | null) {
  if (!isSpotifyConfigured()) {
    return buildFallbackDashboard(
      "Add Spotify credentials, then connect your account.",
      false,
    );
  }

  if (!session) {
    return buildFallbackDashboard(
      "Spotify credentials are ready. Connect your account to load live data.",
      true,
    );
  }

  if (Date.now() >= session.expiresAt) {
    return buildFallbackDashboard(
      "Your Spotify session expired. Connect again to refresh live data.",
      true,
    );
  }

  try {
    const [profile, topTracks, savedTracks] = await Promise.all([
      fetchSpotify<SpotifyProfile>(session, "/me"),
      fetchSpotify<SpotifyTopTracksResponse>(
        session,
        "/me/top/tracks?limit=5&time_range=medium_term",
      ),
      fetchSpotify<SpotifySavedTracksResponse>(session, "/me/tracks?limit=1"),
    ]);

    const tracks: TopTrack[] = topTracks.items.map((track) => ({
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      detail: `Popularity ${track.popularity ?? 0}/100`,
      imageUrl: track.album.images?.[0]?.url,
      spotifyUrl: track.external_urls?.spotify,
    }));

    return {
      metrics: [
        {
          label: "Saved tracks",
          value: formatNumber(savedTracks.total),
          delta: "From your library",
          description: "Total tracks saved to your Spotify account.",
        },
        {
          label: "Top tracks",
          value: String(topTracks.items.length),
          delta: "Medium-term taste",
          description: "Tracks loaded from your recent Spotify listening profile.",
        },
        {
          label: "Followers",
          value: formatNumber(profile.followers?.total),
          delta: profile.product ? `${profile.product} account` : "Spotify profile",
          description: "Public follower count from your Spotify profile.",
        },
      ],
      topTracks: tracks,
      connection: {
        isConfigured: true,
        isConnected: true,
        isLive: true,
        displayName: profile.display_name ?? profile.email ?? "Spotify listener",
        profileUrl: profile.external_urls?.spotify,
        avatarUrl: profile.images?.[0]?.url,
        product: profile.product,
        message: "Live Spotify data is connected.",
      },
    } satisfies DashboardData;
  } catch {
    const data = buildFallbackDashboard(
      "Spotify connected, but live data could not load. Showing mock data.",
      true,
    );

    return {
      ...data,
      connection: {
        ...data.connection,
        isConnected: true,
      },
    };
  }
}
