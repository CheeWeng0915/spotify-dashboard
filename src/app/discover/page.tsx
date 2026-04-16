import { redirect } from "next/navigation";
import { DiscoverShell } from "@/components/discover-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

export default async function DiscoverPage() {
  const initialProps = await getInitialDashboardShellProps();

  if (!initialProps.spotifyAuthenticated) {
    redirect("/connect?next=/discover");
  }

  return (
    <main>
      <DiscoverShell
        spotifyConfigured={initialProps.spotifyConfigured}
        spotifyAuthenticated={initialProps.spotifyAuthenticated}
        authState={initialProps.authState}
      />
    </main>
  );
}
