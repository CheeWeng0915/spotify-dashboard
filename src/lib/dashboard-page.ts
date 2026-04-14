import { cookies } from "next/headers";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import { isSpotifyConfigured } from "@/lib/spotify";
import {
  isSpotifySessionHardExpired,
  SPOTIFY_SESSION_COOKIE,
  unsealSpotifySession,
} from "@/lib/spotify-session";
import type { DashboardAuthState, DashboardSource } from "@/types/dashboard-api";

export async function getInitialDashboardShellProps() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;
  const session = sessionCookie ? unsealSpotifySession(sessionCookie) : null;
  const spotifyAuthenticated = Boolean(session && !isSpotifySessionHardExpired(session));
  const authState: DashboardAuthState = spotifyAuthenticated
    ? "connected"
    : "not_connected";
  const source: DashboardSource = "mock";

  return {
    data: getMockDashboardData(),
    spotifyConfigured: isSpotifyConfigured(),
    spotifyAuthenticated,
    authState,
    source,
  };
}
