"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TopAlbumList } from "@/components/top-album-list";
import { TopArtistList } from "@/components/top-artist-list";
import { useDashboardState } from "@/components/use-dashboard-state";
import type {
  DashboardData,
  LibraryCategory,
  ListeningPeriod,
} from "@/types/dashboard";
import type { DashboardAuthReason, DashboardAuthState, DashboardSource } from "@/types/dashboard-api";

type LibraryShellProps = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source?: DashboardSource;
  authState?: DashboardAuthState;
  reason?: DashboardAuthReason;
  category: LibraryCategory;
  period: ListeningPeriod;
};

const PERIODS: ListeningPeriod[] = ["daily", "weekly", "monthly", "yearly"];

const PERIOD_LABELS: Record<ListeningPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  artists: "Artists",
  albums: "Albums",
};

export function LibraryShell({
  data,
  spotifyConfigured,
  spotifyAuthenticated,
  source,
  authState,
  reason,
  category,
  period,
}: LibraryShellProps) {
  const state = useDashboardState({
    data,
    spotifyConfigured,
    spotifyAuthenticated,
    source,
    authState,
    reason,
    requireSpotifyConnection: true,
  });

  const activeReport = state.data.reports.find((report) => report.period === period);
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

  return (
    <section className="dashboard" aria-label="Artist and album leaderboard">
      <header className="dashboard__hero glass">
        <div>
          <span className="dashboard__eyebrow">Library</span>
          <h1 className="dashboard__title">
            {CATEGORY_LABELS[category]} · {PERIOD_LABELS[period]}
          </h1>
          <p className="dashboard__copy">
            Explore your top artists and albums with day, week, month, and year windows.
          </p>
          <div className="dashboard__inline-actions">
            <a className="dashboard__api" href="/api/dashboard">
              Open `/api/dashboard`
            </a>
            <Link
              className="dashboard__api dashboard__api--ghost"
              href={`/connect?next=/library/${category}/${period}`}
            >
              Connect page
            </Link>
            <Link className="dashboard__api dashboard__api--ghost" href="/">
              Back to overview
            </Link>
          </div>
        </div>

        <aside className="dashboard__status">
          <span className="dashboard__status-label">Backend status</span>
          <strong className="dashboard__status-value">Next.js API available</strong>
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
              Reconnect is required before library insights can load.
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

      <nav className="library__category-nav" aria-label="Choose leaderboard type">
        {(["artists", "albums"] as const).map((option) => (
          <Link
            key={option}
            href={`/library/${option}/${period}`}
            className={`library__category-link${
              option === category ? " library__category-link--active" : ""
            }`}
          >
            Top {CATEGORY_LABELS[option]}
          </Link>
        ))}
      </nav>

      <nav className="dashboard__tabs" aria-label="Choose report period">
        {PERIODS.map((periodOption) => (
          <Link
            key={periodOption}
            href={`/library/${category}/${periodOption}`}
            className={`dashboard__tab${
              periodOption === period ? " dashboard__tab--active" : ""
            }`}
          >
            {PERIOD_LABELS[periodOption]}
          </Link>
        ))}
      </nav>

      {activeReport ? (
        <article className="dashboard__section" aria-labelledby="library-heading">
          <div className="dashboard__section-head">
            <h2 id="library-heading" className="dashboard__section-title">
              {activeReport.heading} · Top {CATEGORY_LABELS[category]}
            </h2>
            <p className="dashboard__section-copy">{activeReport.subheading}</p>
          </div>
          <div className="dashboard__report-grid dashboard__report-grid--single">
            <section className="dashboard__list-card dashboard__list-card--wide glass">
              <h3 className="dashboard__list-title">Top {CATEGORY_LABELS[category]}</h3>
              {category === "artists" ? (
                <TopArtistList artists={activeReport.topArtists} />
              ) : (
                <TopAlbumList albums={activeReport.topAlbums} />
              )}
            </section>
          </div>
        </article>
      ) : (
        <p className="dashboard__section-copy">No report found for this period.</p>
      )}
    </section>
  );
}
