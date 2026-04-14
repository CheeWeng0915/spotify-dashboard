import { redirect } from "next/navigation";
import { ProfileShell } from "@/components/profile-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

export default async function ProfilePage() {
  const initialProps = await getInitialDashboardShellProps();

  if (!initialProps.spotifyAuthenticated) {
    redirect("/connect?next=/profile");
  }

  return (
    <main>
      <ProfileShell {...initialProps} />
    </main>
  );
}
