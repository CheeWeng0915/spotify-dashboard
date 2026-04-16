"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSpotifyTrackPageUrl } from "@/lib/spotify-links";
import type { DashboardAuthReason, DashboardAuthState } from "@/types/dashboard-api";
import type { NowPlayingPayload } from "@/types/now-playing-api";
import type { NowPlayingTrack } from "@/types/dashboard";

type PlayerShellProps = {
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  authState?: DashboardAuthState;
  reason?: DashboardAuthReason;
};

function formatPlaybackTimestamp(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function PlayerShell({
  spotifyConfigured,
  spotifyAuthenticated,
  authState,
  reason,
}: PlayerShellProps) {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingTrack | undefined>();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);
  const needsReconnect = authState === "needs_reauth" || reason === "missing_scope";
  const openInSpotifyUrl = nowPlaying
    ? getSpotifyTrackPageUrl(nowPlaying.title, nowPlaying.artist)
    : undefined;
  const progressLabel =
    typeof nowPlaying?.progressMs === "number" && typeof nowPlaying.durationMs === "number"
      ? `${formatPlaybackTimestamp(nowPlaying.progressMs)} / ${formatPlaybackTimestamp(
          nowPlaying.durationMs,
        )}`
      : "No active playback";
  const statusText = !spotifyConfigured
    ? "Configure Spotify environment variables to enable playback."
    : needsReconnect
      ? "Reconnect Spotify to grant the latest access."
      : spotifyAuthenticated
        ? nowPlaying?.isPlaying
          ? "Playing on Spotify"
          : "Spotify connected"
        : "Connect Spotify to view playback.";

  const loadPlayback = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/now-playing", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load playback.");
      }

      const payload = (await response.json()) as NowPlayingPayload;

      if (!mountedRef.current) {
        return;
      }

      setNowPlaying(payload.nowPlaying);
      setMessage(
        payload.authState === "connected"
          ? ""
          : "Reconnect Spotify to refresh playback status.",
      );
    } catch {
      if (mountedRef.current) {
        setMessage("Unable to refresh playback right now.");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void loadPlayback();
    const intervalId = window.setInterval(() => {
      void loadPlayback();
    }, 10_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadPlayback]);

  return (
    <section className="player-page" aria-label="Spotify player">
      <header className="feature-hero">
        <div>
          <span className="dashboard__eyebrow">Spotify Player</span>
          <h1 className="dashboard__title">See What Is Playing Right Now</h1>
          <p className="dashboard__copy">
            Keep a lightweight view of your current Spotify track without leaving the app.
          </p>
        </div>
        <aside className="feature-status" aria-live="polite">
          <span className="dashboard__status-label">Status</span>
          <strong className="dashboard__status-value">{statusText}</strong>
          {message ? (
            <span className="dashboard__status-chip dashboard__status-chip--off">
              {message}
            </span>
          ) : null}
          {(needsReconnect || !spotifyAuthenticated) && spotifyConfigured ? (
            <Link className="dashboard__button" href="/connect?next=/dashboard">
              Reconnect Spotify
            </Link>
          ) : null}
        </aside>
      </header>

      <div className="player-layout">
        <section className="feature-panel player-artwork-panel" aria-label="Current track artwork">
          {nowPlaying?.imageUrl ? (
            <img
              className="player-artwork"
              src={nowPlaying.imageUrl}
              alt={`${nowPlaying.title} cover`}
            />
          ) : (
            <span className="player-artwork-placeholder" aria-hidden>
              {nowPlaying?.title.charAt(0).toUpperCase() ?? "S"}
            </span>
          )}
        </section>

        <section className="feature-panel" aria-label="Playback details">
          <span className="dashboard__eyebrow">Now Playing</span>
          <h2 className="detail-panel__title">
            {nowPlaying?.title ?? "Ready when Spotify is"}
          </h2>
          <p className="detail-panel__meta">
            {nowPlaying
              ? `${nowPlaying.artist} - ${nowPlaying.album}`
              : "Open Spotify on a device to show your current track."}
          </p>
          <p className="detail-panel__meta">{progressLabel}</p>
          <div className="organizer-actions">
            <button
              className="dashboard__button dashboard__button--secondary"
              type="button"
              disabled={isLoading}
              onClick={() => {
                void loadPlayback();
              }}
            >
              {isLoading ? "Refreshing" : "Refresh status"}
            </button>
            {openInSpotifyUrl ? (
              <a
                className="dashboard__button"
                href={openInSpotifyUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in Spotify
              </a>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
