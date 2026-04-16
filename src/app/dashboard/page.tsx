import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

export default async function DashboardPage() {
  const initialProps = await getInitialDashboardShellProps();

  if (!initialProps.spotifyAuthenticated) {
    redirect("/connect?next=/dashboard");
  }

  return (
    <main>
      <PlayerShell
        spotifyConfigured={initialProps.spotifyConfigured}
        spotifyAuthenticated={initialProps.spotifyAuthenticated}
        authState={initialProps.authState}
      />
    </main>
  );
}
