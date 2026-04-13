import { DashboardShell } from "@/components/dashboard-shell";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import { isSpotifyConfigured } from "@/lib/spotify";

export default function HomePage() {
  const data = getMockDashboardData();

  return (
    <main>
      <DashboardShell
        data={data}
        spotifyConfigured={isSpotifyConfigured()}
      />
    </main>
  );
}
