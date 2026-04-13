import { type NextRequest, NextResponse } from "next/server";
import { exchangeSpotifyCodeForToken } from "@/lib/spotify-api";
import { getAppUrl, timingSafeStringEqual } from "@/lib/spotify";
import {
  SPOTIFY_AUTH_STATE_COOKIE,
  SPOTIFY_CODE_VERIFIER_COOKIE,
  SPOTIFY_SESSION_COOKIE,
  SPOTIFY_SESSION_COOKIE_MAX_AGE,
  createSpotifySession,
  sealSpotifySession,
} from "@/lib/spotify-session";

function redirectHome(status: "connected" | "error", reason?: string) {
  const url = new URL("/", getAppUrl());
  url.searchParams.set("spotify", status);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  return NextResponse.redirect(url);
}

function clearTemporaryCookies(response: NextResponse) {
  response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);
  response.cookies.delete(SPOTIFY_CODE_VERIFIER_COOKIE);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const expectedState = request.cookies.get(SPOTIFY_AUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(SPOTIFY_CODE_VERIFIER_COOKIE)?.value;
  const secure = process.env.NODE_ENV === "production";

  if (error) {
    const response = redirectHome("error", "spotify_denied");
    clearTemporaryCookies(response);
    return response;
  }

  if (!code || !state || !expectedState || !codeVerifier) {
    const response = redirectHome("error", "missing_oauth_state");
    clearTemporaryCookies(response);
    return response;
  }

  if (!timingSafeStringEqual(state, expectedState)) {
    const response = redirectHome("error", "invalid_oauth_state");
    clearTemporaryCookies(response);
    return response;
  }

  try {
    const token = await exchangeSpotifyCodeForToken(code, codeVerifier);
    const session = createSpotifySession(token);
    const response = redirectHome("connected");

    response.cookies.set(SPOTIFY_SESSION_COOKIE, sealSpotifySession(session), {
      httpOnly: true,
      maxAge: SPOTIFY_SESSION_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure,
    });
    clearTemporaryCookies(response);

    return response;
  } catch {
    const response = redirectHome("error", "token_exchange_failed");
    clearTemporaryCookies(response);
    return response;
  }
}
