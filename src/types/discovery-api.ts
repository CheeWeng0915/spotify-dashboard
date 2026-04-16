import type { DiscoveryData } from "@/types/discovery";
import type {
  DashboardAuthReason,
  DashboardAuthState,
  DashboardSource,
} from "@/types/dashboard-api";

export type DiscoveryPayload = {
  data: DiscoveryData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  source: DashboardSource;
  authState: DashboardAuthState;
  reason?: DashboardAuthReason;
  error?: string;
};
