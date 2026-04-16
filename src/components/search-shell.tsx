"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DashboardAuthReason, DashboardAuthState } from "@/types/dashboard-api";
import type {
  SearchCategory,
  SearchPayload,
  SearchResultItem,
} from "@/types/search-api";

type SearchShellProps = {
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  authState?: DashboardAuthState;
  reason?: DashboardAuthReason;
};

const SEARCH_CATEGORIES: Array<{
  key: SearchCategory;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "tracks", label: "Songs" },
  { key: "artists", label: "Artists" },
  { key: "albums", label: "Albums" },
  { key: "podcasts", label: "Podcasts" },
];

function formatDuration(durationMs: number | undefined) {
  if (typeof durationMs !== "number") {
    return "";
  }

  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function createInitialPayload({
  spotifyConfigured,
  spotifyAuthenticated,
  authState,
  reason,
}: SearchShellProps): SearchPayload {
  return {
    spotifyConfigured,
    spotifyAuthenticated,
    authState: authState ?? (spotifyAuthenticated ? "connected" : "not_connected"),
    reason,
    query: "",
    category: "all",
    results: [],
  };
}

export function SearchShell(props: SearchShellProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [payload, setPayload] = useState<SearchPayload>(() => createInitialPayload(props));
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const needsReconnect = payload.authState === "needs_reauth";
  const canSearch =
    payload.spotifyConfigured && payload.spotifyAuthenticated && !needsReconnect;
  const statusText = useMemo(() => {
    if (!payload.spotifyConfigured) {
      return "Spotify environment variables are not configured yet.";
    }

    if (needsReconnect) {
      return "Reconnect Spotify to continue searching.";
    }

    if (!payload.spotifyAuthenticated) {
      return "Connect Spotify to search music, artists, albums, and podcasts.";
    }

    if (payload.error) {
      return "Spotify search is temporarily unavailable.";
    }

    return "Spotify catalog search ready.";
  }, [
    needsReconnect,
    payload.error,
    payload.spotifyAuthenticated,
    payload.spotifyConfigured,
  ]);

  async function searchSpotify(nextCategory = category) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setPayload((previous) => ({
        ...previous,
        query: "",
        category: nextCategory,
        results: [],
        error: undefined,
      }));
      setSelectedResult(null);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmedQuery)}&category=${nextCategory}`,
        {
          cache: "no-store",
        },
      );
      const nextPayload = (await response.json()) as SearchPayload;

      setPayload(nextPayload);
      setSelectedResult(nextPayload.results[0] ?? null);
    } catch {
      setPayload((previous) => ({
        ...previous,
        error: "spotify_upstream_error",
      }));
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section className="search-page" aria-label="Spotify catalog search">
      <header className="feature-hero">
        <div>
          <span className="dashboard__eyebrow">Spotify Search</span>
          <h1 className="dashboard__title">Find Songs, Artists, Albums, and Podcasts</h1>
          <p className="dashboard__copy">
            Search Spotify, inspect the best match, then open the item on Spotify.
          </p>
        </div>
        <aside className="feature-status" aria-live="polite">
          <span className="dashboard__status-label">Access</span>
          <strong className="dashboard__status-value">{statusText}</strong>
          {needsReconnect || !payload.spotifyAuthenticated ? (
            <Link className="dashboard__button" href="/connect?next=/">
              Reconnect Spotify
            </Link>
          ) : null}
        </aside>
      </header>

      <section className="feature-panel" aria-label="Search controls">
        <form
          className="search-controls"
          onSubmit={(event) => {
            event.preventDefault();
            void searchSpotify();
          }}
        >
          <input
            className="feature-input"
            value={query}
            placeholder="Search by song, artist, album, or podcast"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <button
            className="dashboard__button"
            type="submit"
            disabled={!canSearch || isSearching}
          >
            {isSearching ? "Searching" : "Search"}
          </button>
        </form>

        <nav className="dashboard__tabs" aria-label="Search category">
          {SEARCH_CATEGORIES.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`dashboard__tab${
                category === option.key ? " dashboard__tab--active" : ""
              }`}
              disabled={!canSearch || isSearching}
              onClick={() => {
                setCategory(option.key);
                void searchSpotify(option.key);
              }}
            >
              {option.label}
            </button>
          ))}
        </nav>
      </section>

      <div className="feature-grid">
        <section className="feature-panel" aria-label="Search results">
          <div className="feature-panel__head">
            <h2 className="dashboard__section-title">Results</h2>
            <span className="dashboard__status-label">
              {payload.results.length} items
            </span>
          </div>
          <div className="result-list">
            {payload.results.length === 0 ? (
              <p className="track-list__empty">Search results will appear here.</p>
            ) : (
              payload.results.map((result) => (
                <button
                  className={`result-item${
                    selectedResult?.id === result.id && selectedResult.type === result.type
                      ? " result-item--active"
                      : ""
                  }`}
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedResult(result);
                  }}
                >
                  {result.imageUrl ? (
                    <img
                      className="result-item__image"
                      src={result.imageUrl}
                      alt={`${result.title} cover`}
                    />
                  ) : (
                    <span className="result-item__placeholder" aria-hidden>
                      {result.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="result-item__body">
                    <strong>{result.title}</strong>
                    <span>
                      {result.subtitle}
                      {result.detail ? ` - ${result.detail}` : ""}
                    </span>
                  </span>
                  <span className="result-item__type">{result.type}</span>
                </button>
              ))
            )}
          </div>
        </section>

        <aside className="feature-panel detail-panel" aria-label="Selected result details">
          {selectedResult ? (
            <>
              {selectedResult.imageUrl ? (
                <img
                  className="detail-panel__image"
                  src={selectedResult.imageUrl}
                  alt={`${selectedResult.title} cover`}
                />
              ) : (
                <span className="detail-panel__placeholder" aria-hidden>
                  {selectedResult.title.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="dashboard__eyebrow">{selectedResult.type}</span>
              <h2 className="detail-panel__title">{selectedResult.title}</h2>
              <p className="detail-panel__meta">{selectedResult.subtitle}</p>
              {selectedResult.detail ? (
                <p className="detail-panel__meta">{selectedResult.detail}</p>
              ) : null}
              {selectedResult.durationMs ? (
                <p className="detail-panel__meta">
                  Duration: {formatDuration(selectedResult.durationMs)}
                </p>
              ) : null}
              {selectedResult.spotifyUrl ? (
                <a
                  className="dashboard__button"
                  href={selectedResult.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Spotify
                </a>
              ) : null}
            </>
          ) : (
            <p className="track-list__empty">Select a result to inspect it.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
