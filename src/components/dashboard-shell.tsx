"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TopAlbumList } from "@/components/top-album-list";
import { TopArtistList } from "@/components/top-artist-list";
import { TopTrackList } from "@/components/top-track-list";
import { useDashboardState } from "@/components/use-dashboard-state";
import { useNowPlaying } from "@/components/use-now-playing";
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

type ReportListType = "tracks" | "artists" | "albums";

const REPORT_LIST_OPTIONS: Array<{
  key: ReportListType;
  label: string;
  title: string;
}> = [
  {
    key: "tracks",
    label: "Songs",
    title: "Top 10 Songs",
  },
  {
    key: "artists",
    label: "Artists",
    title: "Top 10 Singers",
  },
  {
    key: "albums",
    label: "Albums",
    title: "Top 10 Albums",
  },
];

function formatPlaybackTimestamp(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

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
  const [reportListSelection, setReportListSelection] = useState<{
    period: ListeningPeriod | null;
    listType: ReportListType;
  }>({
    period: period ?? null,
    listType: "tracks",
  });
  const isOverview = !period;
  const topTracks = activeReport ? activeReport.topTracks.slice(0, 10) : [];
  const topArtists = activeReport ? activeReport.topArtists.slice(0, 10) : [];
  const topAlbums = activeReport ? activeReport.topAlbums.slice(0, 10) : [];
  const supportsLiveNowPlaying =
    isOverview &&
    state.spotifyAuthenticated &&
    state.source === "spotify" &&
    !requiresReconnect;
  const nowPlaying = useNowPlaying({
    enabled: supportsLiveNowPlaying,
    initialNowPlaying: state.data.nowPlaying,
  });
  const nowPlayingProgress =
    typeof nowPlaying?.progressMs === "number" && typeof nowPlaying.durationMs === "number"
      ? `${formatPlaybackTimestamp(nowPlaying.progressMs)} / ${formatPlaybackTimestamp(
          nowPlaying.durationMs,
        )}`
      : null;
  const activeListType =
    reportListSelection.period === activeReport?.period
      ? reportListSelection.listType
      : "tracks";

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
            <div className="dashboard__now-playing" aria-live="polite">
              <span className="dashboard__now-playing-label">Real-time playing</span>
              {state.spotifyAuthenticated && state.source === "spotify" ? (
                nowPlaying ? (
                  <>
                    <p className="dashboard__now-playing-title">{nowPlaying.title}</p>
                    <p className="dashboard__now-playing-meta">
                      {nowPlaying.artist} · {nowPlaying.album}
                      {nowPlayingProgress ? ` · ${nowPlayingProgress}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="dashboard__now-playing-meta">No active playback right now.</p>
                )
              ) : (
                <p className="dashboard__now-playing-meta">
                  Connect Spotify to show your current playing track.
                </p>
              )}
            </div>
          </div>

          <aside className="dashboard__status">
            <span
              className={`dashboard__status-chip${
                state.spotifyConfigured ? "" : " dashboard__status-chip--off"
              }`}
            >
              {statusText}
            </span>
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

                <nav className="dashboard__tabs" aria-label="Choose leaderboard type">
                  {REPORT_LIST_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`dashboard__tab${
                        activeListType === option.key ? " dashboard__tab--active" : ""
                      }`}
                      onClick={() => {
                        setReportListSelection({
                          period: activeReport.period,
                          listType: option.key,
                        });
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </nav>

                <section className="report-showcase__lists">
                  {activeListType === "tracks" ? (
                    <div className="report-panel report-panel--dark">
                      <h3 className="dashboard__list-title">{REPORT_LIST_OPTIONS[0].title}</h3>
                      <TopTrackList tracks={topTracks} />
                    </div>
                  ) : null}
                  {activeListType === "artists" ? (
                    <div className="report-panel">
                      <h3 className="dashboard__list-title">{REPORT_LIST_OPTIONS[1].title}</h3>
                      <TopArtistList artists={topArtists} />
                    </div>
                  ) : null}
                  {activeListType === "albums" ? (
                    <div className="report-panel report-panel--dark">
                      <h3 className="dashboard__list-title">{REPORT_LIST_OPTIONS[2].title}</h3>
                      <TopAlbumList albums={topAlbums} />
                    </div>
                  ) : null}
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
