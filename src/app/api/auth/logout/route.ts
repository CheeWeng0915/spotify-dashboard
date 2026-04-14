import { NextResponse } from "next/server";
import {
  SPOTIFY_AUTH_STATE_COOKIE,
  SPOTIFY_SESSION_COOKIE,
} from "@/lib/spotify";

export function GET(request: Request) {
  const response = NextResponse.redirect(
    new URL("/?spotify=disconnected", request.url),
  );

  response.cookies.delete(SPOTIFY_AUTH_STATE_COOKIE);
  response.cookies.delete(SPOTIFY_SESSION_COOKIE);

  return response;
}
