"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/types/dashboard";

type DashboardSource = "mock" | "spotify";

type DashboardPayload = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source: DashboardSource;
};

type DashboardState = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source: DashboardSource;
  fetchError: boolean;
};

type DashboardProfileState = {
  spotifyAuthenticated: boolean;
  profileName: string;
  profileImageUrl?: string;
};

type UseDashboardStateInput = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
};

let cachedDashboardPayload: DashboardPayload | null = null;
let inFlightDashboardRequest: Promise<DashboardPayload> | null = null;
let cachedDashboardExpiresAt = 0;

const DASHBOARD_CACHE_TTL_MS = 15_000;

const EMPTY_PROFILE_STATE: DashboardProfileState = {
  spotifyAuthenticated: false,
  profileName: "",
};

function readCachedDashboardPayload() {
  if (!cachedDashboardPayload) {
    return null;
  }

  if (Date.now() >= cachedDashboardExpiresAt) {
    cachedDashboardPayload = null;
    return null;
  }

  return cachedDashboardPayload;
}

async function fetchDashboardPayload() {
  const cachedPayload = readCachedDashboardPayload();
  if (cachedPayload) {
    return cachedPayload;
  }

  if (!inFlightDashboardRequest) {
    inFlightDashboardRequest = fetch("/api/dashboard", {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load dashboard data.");
        }

        return response.json() as Promise<DashboardPayload>;
      })
      .then((payload) => {
        cachedDashboardPayload = payload;
        cachedDashboardExpiresAt = Date.now() + DASHBOARD_CACHE_TTL_MS;
        return payload;
      })
      .finally(() => {
        inFlightDashboardRequest = null;
      });
  }

  return inFlightDashboardRequest;
}

function toProfileState(payload: DashboardPayload): DashboardProfileState {
  return {
    spotifyAuthenticated: payload.spotifyAuthenticated,
    profileName: payload.data.profileName,
    profileImageUrl: payload.data.profileImageUrl,
  };
}

export function useDashboardState({
  data,
  spotifyConfigured,
  spotifyAuthenticated,
}: UseDashboardStateInput) {
  const cachedPayload = readCachedDashboardPayload();
  const [state, setState] = useState<DashboardState>(() =>
    cachedPayload
      ? {
          ...cachedPayload,
          fetchError: false,
        }
      : {
          data,
          spotifyConfigured,
          spotifyAuthenticated,
          source: "mock",
          fetchError: false,
        },
  );

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        const payload = await fetchDashboardPayload();

        if (!active) {
          return;
        }

        setState({
          data: payload.data,
          spotifyConfigured: payload.spotifyConfigured,
          spotifyAuthenticated: payload.spotifyAuthenticated,
          source: payload.source,
          fetchError: false,
        });
      } catch {
        if (!active) {
          return;
        }

        setState((previous) => ({
          ...previous,
          fetchError: true,
        }));
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useDashboardProfileState() {
  const cachedPayload = readCachedDashboardPayload();
  const [profileState, setProfileState] = useState<DashboardProfileState>(() =>
    cachedPayload
      ? toProfileState(cachedPayload)
      : EMPTY_PROFILE_STATE,
  );

  useEffect(() => {
    let active = true;

    fetchDashboardPayload()
      .then((payload) => {
        if (!active) {
          return;
        }

        setProfileState(toProfileState(payload));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setProfileState(EMPTY_PROFILE_STATE);
      });

    return () => {
      active = false;
    };
  }, []);

  return profileState;
}
