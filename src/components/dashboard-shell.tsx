"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MetricCard } from "@/components/metric-card";
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

  return (
    <section className="dashboard" aria-label="Spotify reports">
      <header className="dashboard__hero glass">
        <div>
          <h1 className="dashboard__title">
            {isOverview
              ? "Spotify Dashboard Overview"
              : activeReport?.heading ?? "Listening Report"}
          </h1>
          <p className="dashboard__copy">
            {isOverview
              ? "View daily, weekly, monthly, and yearly listening insights in a smooth Apple-style interface."
              : activeReport?.subheading ?? "Track and album stats for this period."}
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
                Open profile
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
              </div>
              <div className="dashboard__grid">
                {activeReport.metrics.map((metric) => (
                  <MetricCard key={`${activeReport.period}-${metric.label}`} metric={metric} />
                ))}
              </div>
              <div className="dashboard__report-grid">
                <section className="dashboard__list-card glass" aria-labelledby="top-track-heading">
                  <h3 id="top-track-heading" className="dashboard__list-title">
                    Top Tracks
                  </h3>
                  <TopTrackList tracks={activeReport.topTracks} />
                </section>
                <section className="dashboard__list-card glass" aria-labelledby="top-album-heading">
                  <h3 id="top-album-heading" className="dashboard__list-title">
                    Top Albums
                  </h3>
                  <TopAlbumList albums={activeReport.topAlbums} />
                </section>
                <section className="dashboard__list-card glass" aria-labelledby="top-artist-heading">
                  <h3 id="top-artist-heading" className="dashboard__list-title">
                    Top Artists
                  </h3>
                  <TopArtistList artists={activeReport.topArtists} />
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
