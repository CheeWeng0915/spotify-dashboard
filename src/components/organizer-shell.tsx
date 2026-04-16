"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardAuthReason, DashboardAuthState } from "@/types/dashboard-api";
import type {
  OrganizerMutationPayload,
  OrganizerPlaylistDetailPayload,
  OrganizerPlaylistItem,
  OrganizerPlaylistListPayload,
  OrganizerPlaylistSummary,
} from "@/types/organizer-api";

type OrganizerShellProps = {
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  authState?: DashboardAuthState;
  reason?: DashboardAuthReason;
};

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function createInitialListPayload({
  spotifyConfigured,
  spotifyAuthenticated,
  authState,
  reason,
}: OrganizerShellProps): OrganizerPlaylistListPayload {
  return {
    spotifyConfigured,
    spotifyAuthenticated,
    authState: authState ?? (spotifyAuthenticated ? "connected" : "not_connected"),
    reason,
    playlists: [],
  };
}

export function OrganizerShell(props: OrganizerShellProps) {
  const [listPayload, setListPayload] = useState<OrganizerPlaylistListPayload>(() =>
    createInitialListPayload(props),
  );
  const [detailPayload, setDetailPayload] =
    useState<OrganizerPlaylistDetailPayload | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const selectedRows = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
  const needsReconnect = listPayload.authState === "needs_reauth";
  const canUseOrganizer =
    listPayload.spotifyConfigured && listPayload.spotifyAuthenticated && !needsReconnect;
  const activePlaylist = detailPayload?.playlist;
  const stats = detailPayload?.stats;

  const loadPlaylistItems = useCallback(async (playlistId: string) => {
    if (!playlistId) {
      return;
    }

    setIsLoadingItems(true);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/organizer/playlists/${playlistId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as OrganizerPlaylistDetailPayload;

      if (!response.ok || payload.error) {
        setStatusMessage(
          payload.error === "playlist_not_editable"
            ? "This playlist cannot be edited by the connected account."
            : "Unable to load that playlist right now.",
        );
        setDetailPayload(payload);
        return;
      }

      setDetailPayload(payload);
      setSelectedRowIds([]);
    } catch {
      setStatusMessage("Unable to load that playlist right now.");
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const loadPlaylists = useCallback(async () => {
    setIsLoadingPlaylists(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/organizer/playlists", {
        cache: "no-store",
      });
      const payload = (await response.json()) as OrganizerPlaylistListPayload;

      setListPayload(payload);

      if (!response.ok || payload.error) {
        setStatusMessage(
          payload.reason === "missing_scope"
            ? "Reconnect Spotify to grant playlist cleanup access."
            : "Unable to load playlists right now.",
        );
        return;
      }

      const firstPlaylistId = payload.playlists[0]?.id ?? "";
      setSelectedPlaylistId(firstPlaylistId);

      if (firstPlaylistId) {
        await loadPlaylistItems(firstPlaylistId);
      }
    } catch {
      setStatusMessage("Unable to load playlists right now.");
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [loadPlaylistItems]);

  useEffect(() => {
    if (props.spotifyAuthenticated) {
      void loadPlaylists();
    }
  }, [loadPlaylists, props.spotifyAuthenticated]);

  function toggleRow(item: OrganizerPlaylistItem) {
    setSelectedRowIds((previous) =>
      previous.includes(item.rowId)
        ? previous.filter((rowId) => rowId !== item.rowId)
        : [...previous, item.rowId],
    );
  }

  function selectDuplicateRows() {
    setSelectedRowIds(detailPayload?.items.filter((item) => item.isDuplicate).map((item) => item.rowId) ?? []);
  }

  function selectUnavailableRows() {
    setSelectedRowIds(
      detailPayload?.items.filter((item) => item.isUnavailable).map((item) => item.rowId) ?? [],
    );
  }

  async function cleanupSelectedRows() {
    if (!activePlaylist || selectedRowIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${selectedRowIds.length} selected item(s) from "${activePlaylist.name}"? This will rewrite the playlist order without those rows.`,
    );

    if (!confirmed) {
      return;
    }

    setIsCleaning(true);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/organizer/playlists/${activePlaylist.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirm: true,
          selectedRowIds,
          snapshotId: activePlaylist.snapshotId,
        }),
      });
      const payload = (await response.json()) as OrganizerMutationPayload;

      if (!response.ok || payload.error) {
        if (payload.error === "playlist_changed") {
          setStatusMessage("This playlist changed on Spotify. Reload it and try again.");
        } else if (payload.error === "cannot_preserve_invalid_items") {
          setStatusMessage("Select all unavailable rows before cleanup so the remaining order can be preserved.");
        } else {
          setStatusMessage("Unable to clean up that playlist right now.");
        }
        return;
      }

      setStatusMessage(`Removed ${payload.removedCount ?? selectedRowIds.length} item(s).`);
      setSelectedRowIds([]);
      await loadPlaylistItems(activePlaylist.id);
    } catch {
      setStatusMessage("Unable to clean up that playlist right now.");
    } finally {
      setIsCleaning(false);
    }
  }

  function renderPlaylistOption(playlist: OrganizerPlaylistSummary) {
    return (
      <button
        className={`organizer-playlist${
          selectedPlaylistId === playlist.id ? " organizer-playlist--active" : ""
        }`}
        key={playlist.id}
        type="button"
        onClick={() => {
          setSelectedPlaylistId(playlist.id);
          void loadPlaylistItems(playlist.id);
        }}
      >
        {playlist.imageUrl ? (
          <img
            className="organizer-playlist__image"
            src={playlist.imageUrl}
            alt={`${playlist.name} cover`}
          />
        ) : (
          <span className="organizer-playlist__placeholder" aria-hidden>
            {playlist.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span>
          <strong>{playlist.name}</strong>
          <span>
            {playlist.totalItems} items - {playlist.ownerName}
          </span>
        </span>
      </button>
    );
  }

  return (
    <section className="organizer-page" aria-label="Spotify playlist organizer">
      <header className="feature-hero">
        <div>
          <span className="dashboard__eyebrow">Playlist Organizer</span>
          <h1 className="dashboard__title">Clean Up Your Spotify Playlists</h1>
          <p className="dashboard__copy">
            Review playlist stats, select duplicate or unavailable rows, then confirm cleanup.
          </p>
        </div>
        <aside className="feature-status" aria-live="polite">
          <span className="dashboard__status-label">Access</span>
          <strong className="dashboard__status-value">
            {canUseOrganizer ? "Playlist cleanup ready" : "Spotify playlist access required"}
          </strong>
          {needsReconnect || !listPayload.spotifyAuthenticated ? (
            <Link className="dashboard__button" href="/connect?next=/organizer">
              Reconnect Spotify
            </Link>
          ) : null}
        </aside>
      </header>

      <div className="organizer-layout">
        <section className="feature-panel" aria-label="Editable playlists">
          <div className="feature-panel__head">
            <h2 className="dashboard__section-title">Playlists</h2>
            <button
              className="result-item__type"
              type="button"
              disabled={!canUseOrganizer || isLoadingPlaylists}
              onClick={() => {
                void loadPlaylists();
              }}
            >
              {isLoadingPlaylists ? "Loading" : "Refresh"}
            </button>
          </div>
          <div className="organizer-playlist-list">
            {listPayload.playlists.length === 0 ? (
              <p className="track-list__empty">Editable playlists will appear here.</p>
            ) : (
              listPayload.playlists.map(renderPlaylistOption)
            )}
          </div>
        </section>

        <section className="feature-panel" aria-label="Playlist cleanup">
          <div className="feature-panel__head">
            <div>
              <h2 className="dashboard__section-title">
                {activePlaylist?.name ?? "Choose a Playlist"}
              </h2>
              {activePlaylist?.spotifyUrl ? (
                <a href={activePlaylist.spotifyUrl} target="_blank" rel="noreferrer">
                  Open in Spotify
                </a>
              ) : null}
            </div>
            <span className="dashboard__status-label">
              {isLoadingItems ? "Loading items" : `${selectedRowIds.length} selected`}
            </span>
          </div>

          {stats ? (
            <div className="organizer-stats" aria-label="Playlist statistics">
              <article>
                <span>Total</span>
                <strong>{stats.totalItems}</strong>
              </article>
              <article>
                <span>Duration</span>
                <strong>{formatDuration(stats.totalDurationMs)}</strong>
              </article>
              <article>
                <span>Duplicates</span>
                <strong>{stats.duplicateItemCount}</strong>
              </article>
              <article>
                <span>Unavailable</span>
                <strong>{stats.unavailableItemCount}</strong>
              </article>
              <article>
                <span>Tracks / Episodes</span>
                <strong>
                  {stats.trackCount} / {stats.episodeCount}
                </strong>
              </article>
            </div>
          ) : null}

          <div className="organizer-actions">
            <button
              className="dashboard__button dashboard__button--secondary"
              type="button"
              disabled={!detailPayload || isCleaning}
              onClick={selectDuplicateRows}
            >
              Select duplicates
            </button>
            <button
              className="dashboard__button dashboard__button--secondary"
              type="button"
              disabled={!detailPayload || isCleaning}
              onClick={selectUnavailableRows}
            >
              Select unavailable
            </button>
            <button
              className="dashboard__button"
              type="button"
              disabled={!detailPayload || selectedRowIds.length === 0 || isCleaning}
              onClick={() => {
                void cleanupSelectedRows();
              }}
            >
              {isCleaning ? "Cleaning" : "Confirm cleanup"}
            </button>
          </div>

          <div className="organizer-items">
            {!detailPayload ? (
              <p className="track-list__empty">Select a playlist to inspect its rows.</p>
            ) : detailPayload.items.length === 0 ? (
              <p className="track-list__empty">This playlist has no items.</p>
            ) : (
              detailPayload.items.map((item) => (
                <label
                  className={`organizer-item${
                    item.isDuplicate || item.isUnavailable ? " organizer-item--flagged" : ""
                  }`}
                  key={item.rowId}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.rowId)}
                    disabled={isCleaning}
                    onChange={() => {
                      toggleRow(item);
                    }}
                  />
                  {item.imageUrl ? (
                    <img
                      className="organizer-item__image"
                      src={item.imageUrl}
                      alt={`${item.title} cover`}
                    />
                  ) : (
                    <span className="organizer-item__placeholder" aria-hidden>
                      {item.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="organizer-item__body">
                    <strong>{item.title}</strong>
                    <span>
                      {item.subtitle} - {item.albumOrShow} - {formatDuration(item.durationMs)}
                    </span>
                  </span>
                  <span className="organizer-item__badge">
                    {item.isUnavailable ? "Unavailable" : item.isDuplicate ? "Duplicate" : item.type}
                  </span>
                </label>
              ))
            )}
          </div>
          {statusMessage ? <p className="feature-message">{statusMessage}</p> : null}
        </section>
      </div>
    </section>
  );
}
