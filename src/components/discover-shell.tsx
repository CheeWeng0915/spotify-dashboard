"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopArtistList } from "@/components/top-artist-list";
import { TopTrackList } from "@/components/top-track-list";
import { getMockDiscoveryData } from "@/lib/mock-discovery";
import type { DashboardAuthReason, DashboardAuthState } from "@/types/dashboard-api";
import type { DiscoveryPayload } from "@/types/discovery-api";

type DiscoverShellProps = {
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  authState?: DashboardAuthState;
  reason?: DashboardAuthReason;
};

const DISCOVERY_REFRESH_INTERVAL_MS = 60_000;

function createInitialPayload({
  spotifyConfigured,
  spotifyAuthenticated,
  authState,
  reason,
}: DiscoverShellProps): DiscoveryPayload {
  return {
    data: getMockDiscoveryData(),
    spotifyConfigured,
    spotifyAuthenticated,
    source: "mock",
    authState: authState ?? (spotifyAuthenticated ? "connected" : "not_connected"),
    reason,
  };
}

export function DiscoverShell(props: DiscoverShellProps) {
  const [state, setState] = useState<DiscoveryPayload>(() => createInitialPayload(props));
  const mountedRef = useRef(true);
  const tracks = state.data.tracks.map((track) => ({
    title: track.title,
    artist: track.artist,
    album: track.album,
    imageUrl: track.imageUrl,
    plays: track.reason,
    duration: "-",
  }));
  const artists = state.data.artists.map((artist) => ({
    name: artist.name,
    imageUrl: artist.imageUrl,
    plays: "Recommended",
    duration: "-",
    topTrack: artist.reason,
  }));

  const loadDiscovery = useCallback(async () => {
    try {
      const response = await fetch("/api/discovery", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load discovery data.");
      }

      const payload = (await response.json()) as DiscoveryPayload;

      if (!mountedRef.current) {
        return;
      }

      setState(payload);
    } catch {
      // Keep the previous ranking data when refresh fails.
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void loadDiscovery();
    const refreshInterval = window.setInterval(() => {
      void loadDiscovery();
    }, DISCOVERY_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loadDiscovery]);

  return (
    <section className="dashboard" aria-label="Discover music rankings">
      <div className="report-showcase__lists">
        <div className="report-panel report-panel--dark">
          <h3 className="dashboard__list-title">Recommended Songs</h3>
          <TopTrackList tracks={tracks} />
        </div>
        <div className="report-panel">
          <h3 className="dashboard__list-title">Recommended Artists</h3>
          <TopArtistList artists={artists} />
        </div>
      </div>
    </section>
  );
}
