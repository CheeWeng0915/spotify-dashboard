import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import {
  getCurrentSpotifyProfile,
  getCurrentUserTopTracks,
  refreshSpotifyAccessToken,
} from "@/lib/spotify-api";
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

    const [profile, topTracks] = await Promise.all([
      getCurrentSpotifyProfile(activeSession.accessToken),
      getCurrentUserTopTracks(activeSession.accessToken),
    ]);
    const response = NextResponse.json({
      data: createDashboardDataFromSpotify(profile, topTracks),
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
