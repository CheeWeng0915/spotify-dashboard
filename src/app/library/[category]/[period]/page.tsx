import { notFound, redirect } from "next/navigation";
import { LibraryShell } from "@/components/library-shell";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";
import type { LibraryCategory, ListeningPeriod } from "@/types/dashboard";

const PERIODS: ListeningPeriod[] = ["daily", "weekly", "monthly", "yearly"];
const CATEGORIES: LibraryCategory[] = ["artists", "albums"];

type LibraryPageProps = {
  params: Promise<{
    category: string;
    period: string;
  }>;
};

export default async function LibraryPage({ params }: LibraryPageProps) {
  const { category, period } = await params;

  if (!CATEGORIES.includes(category as LibraryCategory)) {
    notFound();
  }

  if (!PERIODS.includes(period as ListeningPeriod)) {
    notFound();
  }

  const initialProps = await getInitialDashboardShellProps();

  if (!initialProps.spotifyAuthenticated) {
    redirect(`/connect?next=/library/${category}/${period}`);
  }

  return (
    <main>
      <LibraryShell
        {...initialProps}
        category={category as LibraryCategory}
        period={period as ListeningPeriod}
      />
    </main>
  );
}
