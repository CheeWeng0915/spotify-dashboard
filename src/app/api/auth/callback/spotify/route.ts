import { type NextRequest, NextResponse } from "next/server";
import {
  SPOTIFY_AUTH_STATE_COOKIE,
  SPOTIFY_SESSION_COOKIE,
  exchangeCodeForSpotifySession,
  getCookieOptions,
  serializeSpotifySession,
} from "@/lib/spotify";

function redirectHome(request: Request, status: string) {
  return new URL(`/?spotify=${status}`, request.url);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const storedState = request.cookies.get(SPOTIFY_AUTH_STATE_COOKIE)?.value;

  if (error) {
    const response = NextResponse.redirect(redirectHome(request, "denied"));
    response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);
    return response;
  }

  if (!code || !state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(redirectHome(request, "state-error"));
    response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);
    return response;
  }

  try {
    const session = await exchangeCodeForSpotifySession(code);
    const response = NextResponse.redirect(redirectHome(request, "connected"));

    response.cookies.set(
      SPOTIFY_SESSION_COOKIE,
      serializeSpotifySession(session),
      getCookieOptions(30 * 24 * 60 * 60),
    );
    response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);

    return response;
  } catch {
    const response = NextResponse.redirect(redirectHome(request, "token-error"));
    response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);
    response.cookies.delete(SPOTIFY_SESSION_COOKIE);
    return response;
  }
}
