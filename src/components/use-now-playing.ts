"use client";

import { useEffect, useState } from "react";
import type { NowPlayingTrack } from "@/types/dashboard";
import type { NowPlayingPayload } from "@/types/now-playing-api";

const NOW_PLAYING_POLL_INTERVAL_MS = 10_000;
const NOW_PLAYING_PROGRESS_TICK_MS = 1_000;

type UseNowPlayingInput = {
  enabled: boolean;
  initialNowPlaying?: NowPlayingTrack;
};

export function useNowPlaying({ enabled, initialNowPlaying }: UseNowPlayingInput) {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingTrack | undefined>(initialNowPlaying);

  useEffect(() => {
    setNowPlaying(initialNowPlaying);
  }, [initialNowPlaying]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch("/api/now-playing", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as NowPlayingPayload;

        if (!active) {
          return;
        }

        if (payload.authState !== "connected") {
          setNowPlaying(undefined);
          return;
        }

        setNowPlaying(payload.nowPlaying);
      } catch {
        // Keep the previous now playing snapshot on transient fetch failures.
      }
    };

    void fetchNowPlaying();
    const intervalId = window.setInterval(() => {
      void fetchNowPlaying();
    }, NOW_PLAYING_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const progressIntervalId = window.setInterval(() => {
      setNowPlaying((previous) => {
        if (
          !previous ||
          !previous.isPlaying ||
          typeof previous.progressMs !== "number" ||
          typeof previous.durationMs !== "number"
        ) {
          return previous;
        }

        const nextProgress = Math.min(
          previous.progressMs + NOW_PLAYING_PROGRESS_TICK_MS,
          previous.durationMs,
        );

        if (nextProgress === previous.progressMs) {
          return previous;
        }

        return {
          ...previous,
          progressMs: nextProgress,
        };
      });
    }, NOW_PLAYING_PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(progressIntervalId);
    };
  }, [enabled]);

  return nowPlaying;
}
