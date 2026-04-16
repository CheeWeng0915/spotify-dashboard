import type {
  DashboardAuthReason,
  DashboardAuthState,
} from "@/types/dashboard-api";

export type SearchCategory = "all" | "tracks" | "artists" | "albums" | "podcasts";

export type SearchResultType = "track" | "artist" | "album" | "show" | "episode";

export type SearchResultItem = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  detail?: string;
  durationMs?: number;
  imageUrl?: string;
  spotifyUrl?: string;
};

export type SearchPayload = {
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  authState: DashboardAuthState;
  reason?: DashboardAuthReason;
  error?: string;
  query: string;
  category: SearchCategory;
  results: SearchResultItem[];
};
