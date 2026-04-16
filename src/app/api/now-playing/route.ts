import { NextResponse } from "next/server";
import { getCurrentUserCurrentlyPlaying, SpotifyApiError } from "@/lib/spotify-api";
import { createNowPlayingTrack } from "@/lib/spotify-now-playing";
import {
  applySpotifySessionResponseCookies,
  classifySpotifyRequestError,
  resolveSpotifyRouteSession,
} from "@/lib/spotify-route-auth";
import { getSpotifyConfig } from "@/lib/spotify";
import type { SpotifySession } from "@/lib/spotify-session";
import type { NowPlayingPayload } from "@/types/now-playing-api";

function createPayload(
  payload: Omit<NowPlayingPayload, "spotifyConfigured">,
): NowPlayingPayload {
  return {
    spotifyConfigured: getSpotifyConfig().isConfigured,
    ...payload,
  };
}

function createJsonResponse(
  payload: Omit<NowPlayingPayload, "spotifyConfigured">,
  options: {
    clearSession?: boolean;
    refreshedSession?: SpotifySession;
  } = {},
) {
  const response = NextResponse.json(createPayload(payload));
  applySpotifySessionResponseCookies(response, options);
  return response;
}

export async function GET() {
  const sessionResolution = await resolveSpotifyRouteSession();

  if (sessionResolution.kind === "not_connected") {
    return createJsonResponse(
      {
        spotifyAuthenticated: false,
        source: "mock",
        authState: "not_connected",
        reason: sessionResolution.reason,
      },
      {
        clearSession: sessionResolution.clearSession,
      },
    );
  }

  if (sessionResolution.kind === "needs_reauth") {
    return createJsonResponse(
      {
        spotifyAuthenticated: false,
        source: "mock",
        authState: "needs_reauth",
        reason: sessionResolution.reason,
        error: sessionResolution.error,
      },
      {
        clearSession: true,
      },
    );
  }

  try {
    const currentlyPlaying = await getCurrentUserCurrentlyPlaying(sessionResolution.session.accessToken);

    return createJsonResponse(
      {
        nowPlaying: createNowPlayingTrack(currentlyPlaying),
        spotifyAuthenticated: true,
        source: "spotify",
        authState: "connected",
      },
      {
        refreshedSession: sessionResolution.refreshedSession,
      },
    );
  } catch (error) {
    console.error("spotify_now_playing_fetch_failed", error);
    if (error instanceof SpotifyApiError && error.status === 403) {
      return createJsonResponse(
        {
          spotifyAuthenticated: true,
          source: "spotify",
          authState: "connected",
        },
        {
          refreshedSession: sessionResolution.refreshedSession,
        },
      );
    }

    const classifiedError = classifySpotifyRequestError(error);

    return createJsonResponse(
      {
        spotifyAuthenticated: classifiedError.authState === "transient_error",
        source: "mock",
        authState: classifiedError.authState,
        reason: classifiedError.reason,
        error: classifiedError.error,
      },
      {
        clearSession: classifiedError.clearSession,
        refreshedSession:
          classifiedError.clearSession || classifiedError.authState === "needs_reauth"
            ? undefined
            : sessionResolution.refreshedSession,
      },
    );
  }
}
