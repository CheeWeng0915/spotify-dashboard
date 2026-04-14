import type { DashboardData } from "@/types/dashboard";

export type DashboardSource = "mock" | "spotify";

export type DashboardAuthState =
  | "not_connected"
  | "connected"
  | "needs_reauth"
  | "transient_error";

export type DashboardAuthReason =
  | "missing_session"
  | "hard_expired"
  | "missing_refresh_token"
  | "token_refresh_failed"
  | "spotify_unauthorized"
  | "spotify_rate_limited"
  | "spotify_upstream_error";

export type DashboardPayload = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source: DashboardSource;
  authState: DashboardAuthState;
  reason?: DashboardAuthReason;
  error?: string;
};
