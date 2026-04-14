"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDashboardState } from "@/components/use-dashboard-state";
import type { DashboardData } from "@/types/dashboard";
import type { DashboardAuthReason, DashboardAuthState, DashboardSource } from "@/types/dashboard-api";

type ProfileShellProps = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source?: DashboardSource;
  authState?: DashboardAuthState;
  reason?: DashboardAuthReason;
};

export function ProfileShell({
  data,
  spotifyConfigured,
  spotifyAuthenticated,
  source,
  authState,
  reason,
}: ProfileShellProps) {
  const state = useDashboardState({
    data,
    spotifyConfigured,
    spotifyAuthenticated,
    source,
    authState,
    reason,
    requireSpotifyConnection: true,
  });
  const requiresReconnect = state.authState === "needs_reauth";
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
    <section className="dashboard" aria-label="Profile settings">
      <article className="profile-card glass">
        <span className="dashboard__eyebrow">Profile</span>
        <div className="profile-card__head">
          {state.data.profileImageUrl ? (
            <img
              className="profile-card__avatar"
              src={state.data.profileImageUrl}
              alt={`${state.data.profileName} avatar`}
            />
          ) : (
            <span className="profile-card__avatar profile-card__avatar--fallback" aria-hidden>
              {state.data.profileName.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="dashboard__title profile-card__title">{state.data.profileName}</h1>
            <p className="dashboard__section-copy">
              Source: {sourceLabel} · Updated: {generatedAtLabel}
            </p>
          </div>
        </div>
        <div className="dashboard__inline-actions">
          {state.data.profileUrl && !requiresReconnect ? (
            <a
              className="dashboard__api"
              href={state.data.profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Spotify profile
            </a>
          ) : null}
          <Link className="dashboard__api dashboard__api--ghost" href="/reports/daily">
            Go to reports
          </Link>
          {requiresReconnect ? (
            <Link className="dashboard__button" href="/connect?next=/profile">
              Reconnect Spotify
            </Link>
          ) : null}
          <a className="dashboard__button dashboard__button--secondary" href="/api/auth/logout">
            Log out
          </a>
        </div>
        {requiresReconnect ? (
          <p className="dashboard__status-label">
            Your Spotify session expired. Reconnect to continue.
          </p>
        ) : null}
        {state.authState === "transient_error" ? (
          <p className="dashboard__status-label">
            Spotify is temporarily unavailable. Showing sample data until Spotify recovers.
          </p>
        ) : null}
      </article>
    </section>
  );
}
