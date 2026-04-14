import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";
import type { ListeningPeriod } from "@/types/dashboard";

const PERIODS: ListeningPeriod[] = ["daily", "weekly", "monthly", "yearly"];

type ReportPageProps = {
  params: Promise<{
    period: string;
  }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { period } = await params;

  if (!PERIODS.includes(period as ListeningPeriod)) {
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
}
