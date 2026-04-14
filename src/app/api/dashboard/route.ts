import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SPOTIFY_SESSION_COOKIE,
  getDashboardData,
  parseSpotifySession,
} from "@/lib/spotify";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseSpotifySession(
    cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value,
  );
  const data = await getDashboardData(session);

  return NextResponse.json({
    data,
    spotifyConfigured: data.connection.isConfigured,
  });
}
