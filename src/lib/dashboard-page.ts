import { cookies } from "next/headers";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import { isSpotifyConfigured } from "@/lib/spotify";
import {
  isSpotifySessionHardExpired,
  SPOTIFY_SESSION_COOKIE,
  unsealSpotifySession,
} from "@/lib/spotify-session";

export async function getInitialDashboardShellProps() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;
  const session = sessionCookie ? unsealSpotifySession(sessionCookie) : null;

  return {
    data: getMockDashboardData(),
    spotifyConfigured: isSpotifyConfigured(),
    spotifyAuthenticated: Boolean(session && !isSpotifySessionHardExpired(session)),
  };
}
