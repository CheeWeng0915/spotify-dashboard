import Link from "next/link";
import { getInitialDashboardShellProps } from "@/lib/dashboard-page";

type ConnectPageProps = {
  searchParams: Promise<{
    next?: string;
    spotify?: string;
    reason?: string;
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
  const spotifyStatus = params.spotify;
  const spotifyReason = params.reason;
  const initialProps = await getInitialDashboardShellProps();
  const alreadyConnected = initialProps.spotifyAuthenticated && spotifyStatus !== "error";

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
              {alreadyConnected ? "Reconnect Spotify" : "Connect Spotify"}
            </a>
            <Link className="dashboard__api dashboard__api--ghost" href="/">
              Back to overview
            </Link>
          </div>
          {alreadyConnected ? (
            <p className="dashboard__status-label">
              You are already connected. Reconnect only if your Spotify data stops refreshing.
            </p>
          ) : null}
          {spotifyStatus === "error" ? (
            <p className="dashboard__status-label">
              Spotify connection failed
              {spotifyReason ? ` (${spotifyReason})` : ""}. Please retry.
            </p>
          ) : null}
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
