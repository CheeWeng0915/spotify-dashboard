import { cookies } from "next/headers";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import { isSpotifyConfigured } from "@/lib/spotify";
import {
  SPOTIFY_SESSION_COOKIE,
  unsealSpotifySession,
} from "@/lib/spotify-session";

export async function getInitialDashboardShellProps() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;

  return {
    data: getMockDashboardData(),
    spotifyConfigured: isSpotifyConfigured(),
    spotifyAuthenticated: Boolean(
      sessionCookie && unsealSpotifySession(sessionCookie),
    ),
  };
}
