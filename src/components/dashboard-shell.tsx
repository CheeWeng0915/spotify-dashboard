import { MetricCard } from "@/components/metric-card";
import { TopTrackList } from "@/components/top-track-list";
import type { DashboardData } from "@/types/dashboard";

type DashboardShellProps = {
  data: DashboardData;
};

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z" />
    </svg>
  );
}

function TracksIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18.5A3.5 3.5 0 1 1 7 15.34V5.5c0-.48.34-.9.81-.98l10-1.8A1 1 0 0 1 19 3.7v11.8a3.5 3.5 0 1 1-2-3.16V7.3l-8 1.44v9.76Z" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.5 12a3.5 3.5 0 0 1 3.5-3.5h3v2h-3a1.5 1.5 0 0 0 0 3h3v2h-3A3.5 3.5 0 0 1 8.5 12Zm4.5 1h-2v-2h2v2Zm-4 2.5H6a3.5 3.5 0 1 1 0-7h3v2H6a1.5 1.5 0 0 0 0 3h3v2Zm6-7h3a3.5 3.5 0 1 1 0 7h-3v-2h3a1.5 1.5 0 0 0 0-3h-3v-2Z" />
    </svg>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Dashboard navigation">
      <a className="bottom-nav__item" href="#dashboard">
        <DashboardIcon />
        <span>Dashboard</span>
      </a>
      <a className="bottom-nav__item" href="#tracks">
        <TracksIcon />
        <span>Tracks</span>
      </a>
      <a className="bottom-nav__item" href="#connect">
        <ConnectIcon />
        <span>Connect</span>
      </a>
    </nav>
  );
}

export function DashboardShell({ data }: DashboardShellProps) {
  const { connection } = data;
  const actionHref = connection.isConnected
    ? "/api/auth/logout"
    : "/api/auth/spotify";
  const actionLabel = connection.isConnected ? "Disconnect" : "Connect Spotify";

  return (
    <section className="dashboard" id="dashboard">
      <div className="dashboard__hero">
        <div className="dashboard__intro">
          <span className="dashboard__eyebrow">
            {connection.isLive ? "Live Spotify" : "Spotify Dashboard"}
          </span>
          <h1 className="dashboard__title">
            {connection.displayName
              ? `${connection.displayName}'s listening pulse`
              : "Your Spotify dashboard"}
          </h1>
          <p className="dashboard__copy">
            {connection.message}
          </p>
          <a className="dashboard__button" href={actionHref}>
            {actionLabel}
          </a>
        </div>

        <aside className="dashboard__panel dashboard__status" id="connect">
          <div className="dashboard__profile">
            {connection.avatarUrl ? (
              <img
                className="dashboard__avatar"
                src={connection.avatarUrl}
                alt={`${connection.displayName ?? "Spotify profile"} avatar`}
              />
            ) : (
              <div className="dashboard__avatar dashboard__avatar--empty" />
            )}
            <div>
              <span className="dashboard__status-label">Account</span>
              <strong className="dashboard__status-value">
                {connection.displayName ?? "Not connected"}
              </strong>
            </div>
          </div>
          <span
            className={`dashboard__status-chip${
              connection.isConnected ? "" : " dashboard__status-chip--off"
            }`}
          >
            {connection.isConnected ? "Connected" : "Disconnected"}
          </span>
          <p className="dashboard__status-note">{connection.message}</p>
          {connection.profileUrl ? (
            <a className="dashboard__text-link" href={connection.profileUrl}>
              Open Spotify profile
            </a>
          ) : null}
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

      <div className="dashboard__section" id="tracks">
        <h2 className="dashboard__section-title">Top Tracks</h2>
        <TopTrackList tracks={data.topTracks} />
      </div>

      <BottomNav />
    </section>
  );
}
