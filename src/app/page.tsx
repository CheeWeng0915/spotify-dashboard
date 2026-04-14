import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  SPOTIFY_SESSION_COOKIE,
  getDashboardData,
  parseSpotifySession,
} from "@/lib/spotify";

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = parseSpotifySession(
    cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value,
  );
  const data = await getDashboardData(session);

  return (
    <main>
      <DashboardShell data={data} />
    </main>
  );
}
