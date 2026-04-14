import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import {
  getCurrentSpotifyProfile,
  getCurrentUserTopArtists,
  getCurrentUserRecentlyPlayed,
  getCurrentUserTopTracks,
  refreshSpotifyAccessToken,
} from "@/lib/spotify-api";
import type {
  SpotifyProfile,
  SpotifyRecentlyPlayedItem,
  SpotifyTopArtistsResponse,
  SpotifyTopTracksResponse,
} from "@/lib/spotify-api";
import { createDashboardDataFromSpotify } from "@/lib/spotify-dashboard";
import { getSpotifyConfig } from "@/lib/spotify";
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

const EMPTY_TOP_TRACKS: SpotifyTopTracksResponse = {
  items: [],
};

const EMPTY_TOP_ARTISTS: SpotifyTopArtistsResponse = {
  items: [],
};

function pickImageUrl(images: Array<{ url: string }> | undefined) {
  return images?.[0]?.url;
}

function createConnectedFallbackData(profile: SpotifyProfile): DashboardData {
  const periods: ListeningPeriod[] = ["daily", "weekly", "monthly", "yearly"];

  return {
    generatedAt: new Date().toISOString(),
    profileName: profile.display_name ?? profile.id,
    profileImageUrl: pickImageUrl(profile.images),
    profileUrl: profile.external_urls?.spotify,
    reports: periods.map((period) => ({
      period,
      heading:
        period === "daily"
          ? "Daily Report"
          : period === "weekly"
            ? "Weekly Report"
            : period === "monthly"
              ? "Monthly Report"
              : "Yearly Report (Wrapped Style)",
      subheading:
        "Spotify is connected, but report data could not be loaded right now.",
      metrics: [
        {
          label: "Listening Time",
          value: "No data",
          delta: "Spotify connected",
          description: "Waiting for Spotify report access to become available.",
        },
        {
          label: "Play Count",
          value: "No data",
          delta: "No sample data shown",
          description: "This app will not mix mock reports into a connected account.",
        },
        {
          label: period === "yearly" ? "Song of the Year" : "Most Played Song",
          value: "No data",
          delta: "Try again soon",
          description: "Reconnect if Spotify keeps returning an authorization error.",
        },
      ],
      topTracks: [],
      topArtists: [],
      topAlbums: [],
    })),
  };
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

  if (!session || isSpotifySessionHardExpired(session)) {
    const response = NextResponse.json({
      data: getMockDashboardData(),
      spotifyConfigured: config.isConfigured,
      spotifyAuthenticated: false,
      source: "mock",
    });

    if (session) {
      response.cookies.delete(SPOTIFY_SESSION_COOKIE);
    }

    return response;
  }

  try {
    let activeSession = session;
    let refreshed = false;

    if (isSpotifySessionExpired(session)) {
      if (!session.refreshToken) {
        throw new Error("Missing refresh token.");
      }

      activeSession = createSpotifySession(
        await refreshSpotifyAccessToken(session.refreshToken),
        session.refreshToken,
        session.sessionExpiresAt,
      );
      refreshed = true;
    }

    const profile = await getCurrentSpotifyProfile(activeSession.accessToken);
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
    const response = NextResponse.json({
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
    });

    if (refreshed) {
      const maxAge = getSpotifySessionCookieMaxAge(activeSession);

      response.cookies.set(
        SPOTIFY_SESSION_COOKIE,
        sealSpotifySession(activeSession),
        {
          httpOnly: true,
          maxAge,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        },
      );
    }

    return response;
  } catch (error) {
    console.error("spotify_dashboard_fetch_failed", error);

    try {
      const profile = await getCurrentSpotifyProfile(session.accessToken);

      return NextResponse.json({
        data: createConnectedFallbackData(profile),
        spotifyConfigured: config.isConfigured,
        spotifyAuthenticated: true,
        source: "spotify",
        error: "spotify_fetch_failed",
      });
    } catch (profileError) {
      console.error("spotify_profile_fetch_failed", profileError);
    }

    return NextResponse.json({
      data: getMockDashboardData(),
      spotifyConfigured: config.isConfigured,
      spotifyAuthenticated: true,
      source: "mock",
      error: "spotify_fetch_failed",
    });
  }
}
