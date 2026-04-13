import { MetricCard } from "@/components/metric-card";
import { TopTrackList } from "@/components/top-track-list";
import type { DashboardData } from "@/types/dashboard";

type DashboardShellProps = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
};

export function DashboardShell({
  data,
  spotifyConfigured,
  spotifyAuthenticated,
}: DashboardShellProps) {
  const statusText = spotifyAuthenticated
    ? "Spotify account connected"
    : spotifyConfigured
      ? "Spotify app configured"
      : "Add Spotify env vars to enable live data";

  return (
    <section className="dashboard">
      <div className="dashboard__hero">
        <div>
          <span className="dashboard__eyebrow">Spotify Dashboard</span>
          <h1 className="dashboard__title">Track the listeners, not the wiring.</h1>
          <p className="dashboard__copy">
            This starter gives you a React frontend, shared types, server-side
            helpers, and API routes so you can move straight into Spotify auth,
            analytics, and playback data.
          </p>
          <a className="dashboard__api" href="/api/dashboard">
            Open `/api/dashboard`
          </a>
        </div>

        <aside className="dashboard__panel dashboard__status">
          <span className="dashboard__status-label">Backend status</span>
          <strong className="dashboard__status-value">Next.js API ready</strong>
          <span
            className={`dashboard__status-chip${
              spotifyConfigured ? "" : " dashboard__status-chip--off"
            }`}
          >
            {statusText}
          </span>
          <div className="dashboard__actions">
            <a className="dashboard__button" href="/api/auth/spotify">
              Connect Spotify
            </a>
            {spotifyAuthenticated ? (
              <a
                className="dashboard__button dashboard__button--secondary"
                href="/api/auth/logout"
              >
                Disconnect
              </a>
            ) : null}
          </div>
          <span className="dashboard__status-label">
            Live dashboard data loads through `/api/dashboard` after a Spotify
            account is connected.
          </span>
        </aside>
      </div>

      <div className="dashboard__section">
        <h2 className="dashboard__section-title">Overview</h2>
        <div className="dashboard__grid">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      <div className="dashboard__section">
        <h2 className="dashboard__section-title">Top Tracks</h2>
        <TopTrackList tracks={data.topTracks} />
      </div>
    </section>
  );
}
