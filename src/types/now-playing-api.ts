import type { NowPlayingTrack } from "@/types/dashboard";
import type {
  DashboardAuthReason,
  DashboardAuthState,
  DashboardSource,
} from "@/types/dashboard-api";

export type NowPlayingPayload = {
  nowPlaying?: NowPlayingTrack;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source: DashboardSource;
  authState: DashboardAuthState;
  reason?: DashboardAuthReason;
  error?: string;
};
