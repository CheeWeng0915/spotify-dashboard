"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TopAlbumList } from "@/components/top-album-list";
import { TopArtistList } from "@/components/top-artist-list";
import { TopTrackList } from "@/components/top-track-list";
import { useDashboardState } from "@/components/use-dashboard-state";
import type { DashboardData, ListeningPeriod } from "@/types/dashboard";
import type { DashboardAuthReason, DashboardAuthState, DashboardSource } from "@/types/dashboard-api";

type DashboardShellProps = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source?: DashboardSource;
  authState?: DashboardAuthState;
  reason?: DashboardAuthReason;
  period?: ListeningPeriod;
};

const PERIOD_LABELS: Record<ListeningPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function DashboardShell({
  data,
  spotifyConfigured,
  spotifyAuthenticated,
  source,
  authState,
  reason,
  period,
}: DashboardShellProps) {
  const state = useDashboardState({
    data,
    spotifyConfigured,
    spotifyAuthenticated,
    source,
    authState,
    reason,
    requireSpotifyConnection: Boolean(period),
  });
  const requiresReconnect = state.authState === "needs_reauth";
  const connectHref = period ? `/connect?next=/reports/${period}` : "/connect";

  const statusText = requiresReconnect
    ? "Spotify session is no longer valid. Reconnect to continue."
    : state.spotifyAuthenticated
    ? "Spotify account connected"
    : state.spotifyConfigured
      ? "Connect Spotify from the dedicated connect page to unlock reports."
      : "Configure Spotify environment variables to enable live data.";
  const generatedAtLabel = useMemo(() => {
    const timestamp = Date.parse(state.data.generatedAt);
    if (Number.isNaN(timestamp)) {
      return "Unknown";
    }
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(new Date(timestamp));
  }, [state.data.generatedAt]);
  const sourceLabel = state.source === "spotify" ? "Spotify live data" : "Sample data";
  const activeReport = period
    ? state.data.reports.find((report) => report.period === period)
    : null;
  const isOverview = !period;
  const topTracks = activeReport ? activeReport.topTracks.slice(0, 10) : [];
  const topArtists = activeReport ? activeReport.topArtists.slice(0, 10) : [];
  const topAlbums = activeReport ? activeReport.topAlbums.slice(0, 10) : [];

  return (
    <section className="dashboard" aria-label="Spotify reports">
      {isOverview ? (
        <header className="dashboard__hero glass">
          <div>
            <span className="dashboard__eyebrow">Spotify Intelligence</span>
            <h1 className="dashboard__title">Your Listening, Reframed</h1>
            <p className="dashboard__copy">
              Daily to yearly listening reports, organized into clear product-like views.
            </p>
          </div>

          <aside className="dashboard__status">
            <span
              className={`dashboard__status-chip${
                state.spotifyConfigured ? "" : " dashboard__status-chip--off"
              }`}
            >
              {statusText}
            </span>
            <div className="dashboard__actions">
              {state.spotifyAuthenticated && !requiresReconnect ? (
                <Link className="dashboard__button dashboard__button--secondary" href="/profile">
                  View profile
                </Link>
              ) : (
                <Link className="dashboard__button" href={connectHref}>
                  Connect Spotify
                </Link>
              )}
            </div>
            <span className="dashboard__status-label">
              Source: {sourceLabel} · Updated: {generatedAtLabel}
            </span>
            {state.spotifyAuthenticated && !requiresReconnect && state.source === "spotify" ? (
              <Link className="dashboard__status-account" href="/profile">
                {state.data.profileImageUrl ? (
                  <img
                    className="dashboard__status-avatar"
                    src={state.data.profileImageUrl}
                    alt={`${state.data.profileName} avatar`}
                  />
                ) : (
                  <span className="dashboard__status-avatar dashboard__status-avatar--fallback" aria-hidden>
                    {state.data.profileName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="dashboard__status-label">
                  Current account: {state.data.profileName}
                </span>
              </Link>
            ) : null}
            {requiresReconnect ? (
              <span className="dashboard__status-label">
                Reconnect is required before we can load your Spotify data.
              </span>
            ) : null}
            {state.authState === "transient_error" ? (
              <span className="dashboard__status-label">
                Spotify is temporarily unavailable. Showing sample data until Spotify recovers.
              </span>
            ) : null}
            {state.fetchError ? (
              <span className="dashboard__status-label">
                Unable to refresh latest data right now. Showing the last available result.
              </span>
            ) : null}
          </aside>
        </header>
      ) : null}

      {isOverview ? (
        <nav className="dashboard__period-nav" aria-label="Report period navigation">
          {state.data.reports.map((report) => {
            const keyMetric = report.metrics[0];
            return (
              <Link
                key={report.period}
                href={`/reports/${report.period}`}
                className="dashboard__period-link glass"
              >
                <span className="dashboard__period-chip">{PERIOD_LABELS[report.period]}</span>
                <h2 className="dashboard__period-title">{report.heading}</h2>
                <p className="dashboard__period-copy">{report.subheading}</p>
                {keyMetric ? (
                  <p className="dashboard__period-metric">
                    {keyMetric.label}: {keyMetric.value}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : (
        <>
          <nav className="dashboard__tabs" aria-label="Choose report period">
            {state.data.reports.map((report) => (
              <Link
                key={report.period}
                href={`/reports/${report.period}`}
                className={`dashboard__tab${
                  report.period === activeReport?.period ? " dashboard__tab--active" : ""
                }`}
              >
                {PERIOD_LABELS[report.period]}
              </Link>
            ))}
          </nav>
          {activeReport ? (
            <article className="dashboard__section" aria-labelledby="report-heading">
              <div className="dashboard__section-head">
                <h2 id="report-heading" className="dashboard__section-title">
                  {activeReport.heading}
                </h2>
                <p className="dashboard__section-copy">{activeReport.subheading}</p>
                <p className="dashboard__section-copy">
                  Source: {sourceLabel} · Updated: {generatedAtLabel}
                </p>
              </div>

              <div className="report-showcase" aria-label="Top 10 listening leaderboard">
                <section className="report-showcase__summary" aria-label="Report summary">
                  {activeReport.metrics.slice(0, 3).map((metric) => (
                    <article
                      key={`${activeReport.period}-${metric.label}`}
                      className="report-showcase__summary-card"
                    >
                      <p className="report-showcase__summary-label">{metric.label}</p>
                      <p className="report-showcase__summary-value">{metric.value}</p>
                    </article>
                  ))}
                </section>

                <section className="report-showcase__lists">
                  <div className="report-panel report-panel--dark">
                    <h3 className="dashboard__list-title">Top 10 Songs</h3>
                    <TopTrackList tracks={topTracks} />
                  </div>
                  <div className="report-panel">
                    <h3 className="dashboard__list-title">Top 10 Singers</h3>
                    <TopArtistList artists={topArtists} />
                  </div>
                  <div className="report-panel report-panel--dark">
                    <h3 className="dashboard__list-title">Top 10 Albums</h3>
                    <TopAlbumList albums={topAlbums} />
                  </div>
                </section>
              </div>
            </article>
          ) : (
            <p className="dashboard__section-copy">No report found for this period.</p>
          )}
        </>
      )}
    </section>
  );
}
