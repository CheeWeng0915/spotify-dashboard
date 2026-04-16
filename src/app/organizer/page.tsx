import { redirect } from "next/navigation";
import { OrganizerShell } from "@/components/organizer-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

export default async function OrganizerPage() {
  const initialProps = await getInitialDashboardShellProps();

  if (!initialProps.spotifyAuthenticated) {
    redirect("/connect?next=/organizer");
  }

  return (
    <main>
      <OrganizerShell
        spotifyConfigured={initialProps.spotifyConfigured}
        spotifyAuthenticated={initialProps.spotifyAuthenticated}
        authState={initialProps.authState}
      />
    </main>
  );
}
