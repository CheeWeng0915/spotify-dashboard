import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";
import type { ListeningPeriod } from "@/types/dashboard";

type ReportsPageFactoryConfig = {
  periods: ListeningPeriod[];
};

type ReportsPageProps = {
  params: Promise<{
    period: string;
  }>;
};

export function createReportsPage(config: ReportsPageFactoryConfig) {
  return async function ReportsPage({ params }: ReportsPageProps) {
    const { period } = await params;

    if (!config.periods.includes(period as ListeningPeriod)) {
      notFound();
    }

    const initialProps = await getInitialDashboardShellProps();

    if (!initialProps.spotifyAuthenticated) {
      redirect(`/connect?next=/reports/${period}`);
    }

    return (
      <main>
        <DashboardShell {...initialProps} period={period as ListeningPeriod} />
      </main>
    );
  };
}
