import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/spotify";
import {
  SPOTIFY_AUTH_STATE_COOKIE,
  SPOTIFY_CODE_VERIFIER_COOKIE,
  SPOTIFY_OAUTH_REDIRECT_URI_COOKIE,
  SPOTIFY_POST_AUTH_REDIRECT_COOKIE,
  SPOTIFY_SESSION_COOKIE,
} from "@/lib/spotify-session";

export function GET() {
  const url = new URL("/", getAppUrl());
  url.searchParams.set("spotify", "disconnected");

  const response = NextResponse.redirect(url);

  response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);
  response.cookies.delete(SPOTIFY_CODE_VERIFIER_COOKIE);
  response.cookies.delete(SPOTIFY_OAUTH_REDIRECT_URI_COOKIE);
  response.cookies.delete(SPOTIFY_POST_AUTH_REDIRECT_COOKIE);
  response.cookies.delete(SPOTIFY_SESSION_COOKIE);

  return response;
}
