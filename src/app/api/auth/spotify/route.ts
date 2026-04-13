import { NextResponse } from "next/server";
import {
  SpotifyConfigError,
  createCodeChallenge,
  createRandomString,
  createSpotifyAuthorizeUrl,
} from "@/lib/spotify";
import {
  SPOTIFY_AUTH_STATE_COOKIE,
  SPOTIFY_CODE_VERIFIER_COOKIE,
  SPOTIFY_TEMP_COOKIE_MAX_AGE,
} from "@/lib/spotify-session";

export function GET() {
  try {
    const state = createRandomString();
    const codeVerifier = createRandomString();
    const authorizeUrl = createSpotifyAuthorizeUrl({
      state,
      codeChallenge: createCodeChallenge(codeVerifier),
    });
    const response = NextResponse.redirect(authorizeUrl);
    const secure = process.env.NODE_ENV === "production";

    response.cookies.set(SPOTIFY_AUTH_STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: SPOTIFY_TEMP_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure,
    });
    response.cookies.set(SPOTIFY_CODE_VERIFIER_COOKIE, codeVerifier, {
      httpOnly: true,
      maxAge: SPOTIFY_TEMP_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure,
    });

    return response;
  } catch (error) {
    if (error instanceof SpotifyConfigError) {
      return NextResponse.json(
        {
          error: "Missing Spotify configuration",
          missing: error.missing,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Spotify authorization failed",
      },
      { status: 500 },
    );
  }
}
