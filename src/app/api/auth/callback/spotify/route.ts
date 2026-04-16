import { type NextRequest, NextResponse } from "next/server";
import { exchangeSpotifyCodeForToken } from "@/lib/spotify-api";
import { getRequestOrigin, timingSafeStringEqual } from "@/lib/spotify";
import {
  getSpotifySessionCookieMaxAge,
  SPOTIFY_AUTH_STATE_COOKIE,
  SPOTIFY_CODE_VERIFIER_COOKIE,
  SPOTIFY_OAUTH_REDIRECT_URI_COOKIE,
  SPOTIFY_POST_AUTH_REDIRECT_COOKIE,
  SPOTIFY_SESSION_COOKIE,
  createSpotifySession,
  sealSpotifySession,
} from "@/lib/spotify-session";

function getSafeRedirectPath(path: string | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}

function createRedirectResponse(
  requestOrigin: string,
  path: string,
  status: "connected" | "error",
  reason?: string,
) {
  const url = new URL(path, requestOrigin);
  url.searchParams.set("spotify", status);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  return NextResponse.redirect(url);
}

function clearTemporaryCookies(response: NextResponse) {
  response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);
  response.cookies.delete(SPOTIFY_CODE_VERIFIER_COOKIE);
  response.cookies.delete(SPOTIFY_POST_AUTH_REDIRECT_COOKIE);
  response.cookies.delete(SPOTIFY_OAUTH_REDIRECT_URI_COOKIE);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const expectedState = request.cookies.get(SPOTIFY_AUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(SPOTIFY_CODE_VERIFIER_COOKIE)?.value;
  const postAuthRedirectPath = getSafeRedirectPath(
    request.cookies.get(SPOTIFY_POST_AUTH_REDIRECT_COOKIE)?.value,
  );
  const callbackRedirectUri = request.cookies.get(
    SPOTIFY_OAUTH_REDIRECT_URI_COOKIE,
  )?.value;
  const secure = process.env.NODE_ENV === "production";

  if (error) {
    const response = createRedirectResponse(
      requestOrigin,
      "/",
      "error",
      "spotify_denied",
    );
    clearTemporaryCookies(response);
    return response;
  }

  if (!code || !state || !expectedState || !codeVerifier) {
    const response = createRedirectResponse(
      requestOrigin,
      "/",
      "error",
      "missing_oauth_state",
    );
    clearTemporaryCookies(response);
    return response;
  }

  if (!timingSafeStringEqual(state, expectedState)) {
    const response = createRedirectResponse(
      requestOrigin,
      "/",
      "error",
      "invalid_oauth_state",
    );
    clearTemporaryCookies(response);
    return response;
  }

  try {
    const now = Date.now();
    const token = await exchangeSpotifyCodeForToken(
      code,
      codeVerifier,
      callbackRedirectUri,
    );
    const session = createSpotifySession(token, undefined, now + 24 * 60 * 60 * 1000);
    const response = createRedirectResponse(
      requestOrigin,
      postAuthRedirectPath,
      "connected",
    );

    response.cookies.set(SPOTIFY_SESSION_COOKIE, sealSpotifySession(session), {
      httpOnly: true,
      maxAge: getSpotifySessionCookieMaxAge(session, now),
      path: "/",
      sameSite: "lax",
      secure,
    });
    clearTemporaryCookies(response);

    return response;
  } catch {
    const response = createRedirectResponse(
      requestOrigin,
      "/",
      "error",
      "token_exchange_failed",
    );
    clearTemporaryCookies(response);
    return response;
  }
}
