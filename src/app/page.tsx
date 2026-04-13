import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard-shell";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import { isSpotifyConfigured } from "@/lib/spotify";
import {
  SPOTIFY_SESSION_COOKIE,
  unsealSpotifySession,
} from "@/lib/spotify-session";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;
  const data = getMockDashboardData();

  return (
    <main>
      <DashboardShell
        data={data}
        spotifyConfigured={isSpotifyConfigured()}
        spotifyAuthenticated={Boolean(
          sessionCookie && unsealSpotifySession(sessionCookie),
        )}
      />
    </main>
  );
}
