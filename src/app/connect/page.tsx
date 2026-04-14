import Link from "next/link";
import { redirect } from "next/navigation";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

type ConnectPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

function getSafeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/reports/daily";
  }

  return nextPath;
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const initialProps = await getInitialDashboardShellProps();

  if (initialProps.spotifyAuthenticated) {
    redirect(nextPath);
  }

  return (
    <main>
      <section className="dashboard">
        <article className="connect-card glass">
          <span className="dashboard__eyebrow">Spotify Access</span>
          <h1 className="dashboard__title">Connect Spotify to continue</h1>
          <p className="dashboard__copy">
            Reports are available only for connected accounts. Connect once to unlock
            tracks, albums, artists, and profile pages.
          </p>
          <div className="dashboard__inline-actions">
            <a
              className="dashboard__button"
              href={`/api/auth/spotify?next=${encodeURIComponent(nextPath)}`}
            >
              Connect Spotify
            </a>
            <Link className="dashboard__api dashboard__api--ghost" href="/">
              Back to overview
            </Link>
          </div>
          {!initialProps.spotifyConfigured ? (
            <p className="dashboard__status-label">
              Spotify environment variables are not configured yet.
            </p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
