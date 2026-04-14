import { NextResponse } from "next/server";
import {
  SPOTIFY_AUTH_STATE_COOKIE,
  buildSpotifyAuthorizeUrl,
  createSpotifyAuthState,
  getCookieOptions,
  getSpotifyConfig,
} from "@/lib/spotify";

export function GET() {
  const config = getSpotifyConfig();

  if (!config.isConfigured) {
    return NextResponse.json(
      {
        error: "Missing Spotify configuration",
        message:
          "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to enable auth.",
      },
      { status: 400 },
    );
  }

  const state = createSpotifyAuthState();
  const response = NextResponse.redirect(buildSpotifyAuthorizeUrl(state));

  response.cookies.set(
    SPOTIFY_AUTH_STATE_COOKIE,
    state,
    getCookieOptions(10 * 60),
  );

  return response;
}
