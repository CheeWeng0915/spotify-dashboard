import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { refreshSpotifyAccessToken, SpotifyApiError } from "@/lib/spotify-api";
import {
  createSpotifySession,
  getSpotifySessionCookieMaxAge,
  isSpotifySessionExpired,
  isSpotifySessionHardExpired,
  sealSpotifySession,
  SPOTIFY_SESSION_COOKIE,
  type SpotifySession,
  unsealSpotifySession,
} from "@/lib/spotify-session";
import type { DashboardAuthReason, DashboardAuthState } from "@/types/dashboard-api";

export type SpotifyRouteSessionResolution =
  | {
      kind: "ready";
      session: SpotifySession;
      refreshedSession?: SpotifySession;
    }
  | {
      kind: "not_connected";
      reason: "missing_session" | "hard_expired";
      clearSession: boolean;
    }
  | {
      kind: "needs_reauth";
      reason: "missing_refresh_token" | "token_refresh_failed";
      clearSession: true;
      error: "spotify_reauth_required";
    };

export function classifySpotifyRequestError(error: unknown): {
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
  }

  return {
    authState: "transient_error",
    reason: "spotify_upstream_error",
    clearSession: false,
    error: "spotify_upstream_error",
  };
}

export async function resolveSpotifyRouteSession(): Promise<SpotifyRouteSessionResolution> {
  const cookieStore = await cookies();
  const sealedSession = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;
  const session = sealedSession ? unsealSpotifySession(sealedSession) : null;

  if (!session) {
    return {
      kind: "not_connected",
      reason: "missing_session",
      clearSession: Boolean(sealedSession),
    };
  }

  if (isSpotifySessionHardExpired(session)) {
    return {
      kind: "not_connected",
      reason: "hard_expired",
      clearSession: true,
    };
  }

  if (!isSpotifySessionExpired(session)) {
    return {
      kind: "ready",
      session,
    };
  }

  if (!session.refreshToken) {
    return {
      kind: "needs_reauth",
      reason: "missing_refresh_token",
      clearSession: true,
      error: "spotify_reauth_required",
    };
  }

  try {
    const refreshedSession = createSpotifySession(
      await refreshSpotifyAccessToken(session.refreshToken),
      session.refreshToken,
      session.sessionExpiresAt,
    );

    return {
      kind: "ready",
      session: refreshedSession,
      refreshedSession,
    };
  } catch (error) {
    console.error("spotify_token_refresh_failed", error);

    return {
      kind: "needs_reauth",
      reason: "token_refresh_failed",
      clearSession: true,
      error: "spotify_reauth_required",
    };
  }
}

export function applySpotifySessionResponseCookies(
  response: NextResponse,
  options: {
    clearSession?: boolean;
    refreshedSession?: SpotifySession;
  } = {},
) {
  if (options.clearSession) {
    response.cookies.delete(SPOTIFY_SESSION_COOKIE);
  }

  if (options.refreshedSession && !options.clearSession) {
    response.cookies.set(SPOTIFY_SESSION_COOKIE, sealSpotifySession(options.refreshedSession), {
      httpOnly: true,
      maxAge: getSpotifySessionCookieMaxAge(options.refreshedSession),
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
