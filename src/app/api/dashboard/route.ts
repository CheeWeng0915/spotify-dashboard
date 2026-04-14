import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import {
  getCurrentSpotifyProfile,
  getCurrentUserTopArtists,
  getCurrentUserRecentlyPlayed,
  getCurrentUserTopTracks,
  refreshSpotifyAccessToken,
  SpotifyApiError,
} from "@/lib/spotify-api";
import type {
  SpotifyProfile,
  SpotifyRecentlyPlayedItem,
  SpotifyTopArtistsResponse,
  SpotifyTopTracksResponse,
} from "@/lib/spotify-api";
import { createDashboardDataFromSpotify } from "@/lib/spotify-dashboard";
import { getSpotifyConfig } from "@/lib/spotify";
import type {
  DashboardAuthReason,
  DashboardAuthState,
  DashboardPayload,
} from "@/types/dashboard-api";
import {
  getSpotifySessionCookieMaxAge,
  SPOTIFY_SESSION_COOKIE,
  createSpotifySession,
  isSpotifySessionExpired,
  isSpotifySessionHardExpired,
  sealSpotifySession,
  unsealSpotifySession,
} from "@/lib/spotify-session";
import type { DashboardData, ListeningPeriod } from "@/types/dashboard";

const RECENTLY_PLAYED_PAGE_LIMIT = 50;
const MAX_RECENTLY_PLAYED_REQUESTS = 20;
const YEAR_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;
const TOP_ITEMS_LIMIT = 50;

function createMockPayload(options: {
  spotifyConfigured: boolean;
  authState: DashboardAuthState;
  reason: DashboardAuthReason;
  spotifyAuthenticated?: boolean;
  error?: string;
}): DashboardPayload {
  return {
    data: getMockDashboardData(),
    spotifyConfigured: options.spotifyConfigured,
    spotifyAuthenticated: options.spotifyAuthenticated ?? false,
    source: "mock",
    authState: options.authState,
    reason: options.reason,
    error: options.error,
  };
}

function classifySpotifyFetchError(error: unknown): {
  authState: DashboardAuthState;
  reason: DashboardAuthReason;
  clearSession: boolean;
  error: string;
} {
  if (error instanceof SpotifyApiError) {
    if (error.status === 401 || error.status === 403) {
      return {
        authState: "needs_reauth",
        reason: "spotify_unauthorized",
        clearSession: true,
        error: "spotify_unauthorized",
      };
    }

    if (error.status === 429) {
      return {
        authState: "transient_error",
        reason: "spotify_rate_limited",
        clearSession: false,
        error: "spotify_rate_limited",
      };
    }

    return {
      authState: "transient_error",
      reason: "spotify_upstream_error",
      clearSession: false,
      error: "spotify_upstream_error",
    };
  }

  return {
    authState: "transient_error",
    reason: "spotify_upstream_error",
    clearSession: false,
    error: "spotify_upstream_error",
  };
}

function createJsonResponse(
  payload: DashboardPayload,
  options: {
    clearSession?: boolean;
    refreshedSession?: ReturnType<typeof createSpotifySession>;
  } = {},
) {
  const response = NextResponse.json(payload);

  if (options.clearSession) {
    response.cookies.delete(SPOTIFY_SESSION_COOKIE);
  }

  if (options.refreshedSession) {
    response.cookies.set(SPOTIFY_SESSION_COOKIE, sealSpotifySession(options.refreshedSession), {
      httpOnly: true,
      maxAge: getSpotifySessionCookieMaxAge(options.refreshedSession),
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

async function getRecentlyPlayedHistory(accessToken: string, nowMs = Date.now()) {
  const cutoffMs = nowMs - YEAR_WINDOW_MS;
  const collected: SpotifyRecentlyPlayedItem[] = [];
  let before: number | undefined;

  for (let page = 0; page < MAX_RECENTLY_PLAYED_REQUESTS; page += 1) {
    const response = await getCurrentUserRecentlyPlayed(accessToken, {
      limit: RECENTLY_PLAYED_PAGE_LIMIT,
      before,
    });

    if (response.items.length === 0) {
      break;
    }

    collected.push(...response.items);
    const oldestItem = response.items[response.items.length - 1];
    const oldestPlayedAt = Date.parse(oldestItem.played_at);

    if (
      Number.isNaN(oldestPlayedAt) ||
      oldestPlayedAt < cutoffMs ||
      response.items.length < RECENTLY_PLAYED_PAGE_LIMIT
    ) {
      break;
    }

    before = oldestPlayedAt - 1;
  }

  return collected;
}

async function withSpotifyFallback<T>(
  label: string,
  request: Promise<T>,
  fallback: T,
) {
  try {
    return await request;
  } catch (error) {
    console.error(`spotify_optional_fetch_failed:${label}`, error);
    return fallback;
  }
}

export async function GET() {
  const config = getSpotifyConfig();
  const cookieStore = await cookies();
  const sealedSession = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;
  const session = sealedSession ? unsealSpotifySession(sealedSession) : null;

  if (!session) {
    return createJsonResponse(
      createMockPayload({
        spotifyConfigured: config.isConfigured,
        authState: "not_connected",
        reason: "missing_session",
      }),
      {
        clearSession: Boolean(sealedSession),
      },
    );
  }

  if (isSpotifySessionHardExpired(session)) {
    return createJsonResponse(
      createMockPayload({
        spotifyConfigured: config.isConfigured,
        authState: "not_connected",
        reason: "hard_expired",
      }),
      {
        clearSession: true,
      },
    );
  }

  let activeSession = session;
  let refreshedSession: ReturnType<typeof createSpotifySession> | undefined;

  if (isSpotifySessionExpired(session)) {
    if (!session.refreshToken) {
      return createJsonResponse(
        createMockPayload({
          spotifyConfigured: config.isConfigured,
          authState: "needs_reauth",
          reason: "missing_refresh_token",
          error: "spotify_reauth_required",
        }),
        {
          clearSession: true,
        },
      );
    }

    try {
      activeSession = createSpotifySession(
        await refreshSpotifyAccessToken(session.refreshToken),
        session.refreshToken,
        session.sessionExpiresAt,
      );
      refreshedSession = activeSession;
    } catch (error) {
      console.error("spotify_token_refresh_failed", error);

      return createJsonResponse(
        createMockPayload({
          spotifyConfigured: config.isConfigured,
          authState: "needs_reauth",
          reason: "token_refresh_failed",
          error: "spotify_reauth_required",
        }),
        {
          clearSession: true,
        },
      );
    }
  }

  try {
    const [
      shortTermTopTracks,
      mediumTermTopTracks,
      longTermTopTracks,
      shortTermTopArtists,
      mediumTermTopArtists,
      longTermTopArtists,
      recentlyPlayed,
    ] = await Promise.all([
        withSpotifyFallback(
          "top_tracks_short_term",
          getCurrentUserTopTracks(activeSession.accessToken, "short_term", TOP_ITEMS_LIMIT),
          EMPTY_TOP_TRACKS,
        ),
        withSpotifyFallback(
          "top_tracks_medium_term",
          getCurrentUserTopTracks(activeSession.accessToken, "medium_term", TOP_ITEMS_LIMIT),
          EMPTY_TOP_TRACKS,
        ),
        withSpotifyFallback(
          "top_tracks_long_term",
          getCurrentUserTopTracks(activeSession.accessToken, "long_term", TOP_ITEMS_LIMIT),
          EMPTY_TOP_TRACKS,
        ),
        withSpotifyFallback(
          "top_artists_short_term",
          getCurrentUserTopArtists(activeSession.accessToken, "short_term", TOP_ITEMS_LIMIT),
          EMPTY_TOP_ARTISTS,
        ),
        withSpotifyFallback(
          "top_artists_medium_term",
          getCurrentUserTopArtists(activeSession.accessToken, "medium_term", TOP_ITEMS_LIMIT),
          EMPTY_TOP_ARTISTS,
        ),
        withSpotifyFallback(
          "top_artists_long_term",
          getCurrentUserTopArtists(activeSession.accessToken, "long_term", TOP_ITEMS_LIMIT),
          EMPTY_TOP_ARTISTS,
        ),
        withSpotifyFallback(
          "recently_played",
          getRecentlyPlayedHistory(activeSession.accessToken),
          [] as SpotifyRecentlyPlayedItem[],
        ),
      ]);
    return createJsonResponse(
      {
        data: createDashboardDataFromSpotify({
          profile,
          topTracks: {
            shortTerm: shortTermTopTracks,
            mediumTerm: mediumTermTopTracks,
            longTerm: longTermTopTracks,
          },
          topArtists: {
            shortTerm: shortTermTopArtists,
            mediumTerm: mediumTermTopArtists,
            longTerm: longTermTopArtists,
          },
          recentlyPlayed,
        }),
        spotifyConfigured: config.isConfigured,
        spotifyAuthenticated: true,
        source: "spotify",
        authState: "connected",
      },
      {
        refreshedSession,
      },
    );
  } catch (error) {
    console.error("spotify_dashboard_fetch_failed", error);
    const classifiedError = classifySpotifyFetchError(error);

    return createJsonResponse(
      createMockPayload({
        spotifyConfigured: config.isConfigured,
        authState: classifiedError.authState,
        reason: classifiedError.reason,
        spotifyAuthenticated: classifiedError.authState === "transient_error",
        error: classifiedError.error,
      }),
      {
        clearSession: classifiedError.clearSession,
        refreshedSession:
          classifiedError.clearSession || classifiedError.authState === "needs_reauth"
            ? undefined
            : refreshedSession,
      },
    );
  }
}
