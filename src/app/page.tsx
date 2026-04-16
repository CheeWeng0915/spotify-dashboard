import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

export default async function HomePage() {
  const initialProps = await getInitialDashboardShellProps();

  if (!initialProps.spotifyAuthenticated) {
    redirect("/connect");
  }

  return (
    <main>
      <DashboardShell {...initialProps} />
    </main>
  );
}
