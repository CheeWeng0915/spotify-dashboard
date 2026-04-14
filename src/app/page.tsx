import { DashboardShell } from "@/components/dashboard-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

export default async function HomePage() {
  const initialProps = await getInitialDashboardShellProps();

  return (
    <main>
      <DashboardShell {...initialProps} />
    </main>
  );
}
