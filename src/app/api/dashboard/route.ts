import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import {
  getCurrentSpotifyProfile,
  getCurrentUserRecentlyPlayed,
  getCurrentUserTopTracks,
  refreshSpotifyAccessToken,
} from "@/lib/spotify-api";
import type { SpotifyRecentlyPlayedItem } from "@/lib/spotify-api";
import { createDashboardDataFromSpotify } from "@/lib/spotify-dashboard";
import { getSpotifyConfig } from "@/lib/spotify";
import {
  SPOTIFY_SESSION_COOKIE,
  SPOTIFY_SESSION_COOKIE_MAX_AGE,
  createSpotifySession,
  isSpotifySessionExpired,
  sealSpotifySession,
  unsealSpotifySession,
} from "@/lib/spotify-session";

const RECENTLY_PLAYED_PAGE_LIMIT = 50;
const MAX_RECENTLY_PLAYED_REQUESTS = 20;
const YEAR_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

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

export async function GET() {
  const config = getSpotifyConfig();
  const cookieStore = await cookies();
  const sealedSession = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;
  const session = sealedSession ? unsealSpotifySession(sealedSession) : null;

  if (!session) {
    return NextResponse.json({
      data: getMockDashboardData(),
      spotifyConfigured: config.isConfigured,
      spotifyAuthenticated: false,
      source: "mock",
    });
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
      );
      refreshed = true;
    }

    const [profile, shortTermTopTracks, mediumTermTopTracks, longTermTopTracks, recentlyPlayed] =
      await Promise.all([
        getCurrentSpotifyProfile(activeSession.accessToken),
        getCurrentUserTopTracks(activeSession.accessToken, "short_term", 10),
        getCurrentUserTopTracks(activeSession.accessToken, "medium_term", 10),
        getCurrentUserTopTracks(activeSession.accessToken, "long_term", 10),
        getRecentlyPlayedHistory(activeSession.accessToken).catch(
          () => [] as SpotifyRecentlyPlayedItem[],
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
        recentlyPlayed,
      }),
      spotifyConfigured: config.isConfigured,
      spotifyAuthenticated: true,
      source: "spotify",
    });

    if (refreshed) {
      response.cookies.set(
        SPOTIFY_SESSION_COOKIE,
        sealSpotifySession(activeSession),
        {
          httpOnly: true,
          maxAge: SPOTIFY_SESSION_COOKIE_MAX_AGE,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        },
      );
    }

    return response;
  } catch {
    const response = NextResponse.json({
      data: getMockDashboardData(),
      spotifyConfigured: config.isConfigured,
      spotifyAuthenticated: false,
      source: "mock",
      error: "spotify_fetch_failed",
    });

    response.cookies.delete(SPOTIFY_SESSION_COOKIE);

    return response;
  }
}
