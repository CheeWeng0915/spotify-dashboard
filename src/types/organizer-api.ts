import type {
  DashboardAuthReason,
  DashboardAuthState,
} from "@/types/dashboard-api";

export type OrganizerPlaylistSummary = {
  id: string;
  name: string;
  ownerName: string;
  totalItems: number;
  imageUrl?: string;
  spotifyUrl?: string;
  snapshotId?: string;
};

export type OrganizerPlaylistItem = {
  rowId: string;
  position: number;
  type: "track" | "episode" | "unknown";
  title: string;
  subtitle: string;
  albumOrShow: string;
  durationMs: number;
  uri?: string;
  imageUrl?: string;
  spotifyUrl?: string;
  isDuplicate: boolean;
  duplicateGroup?: string;
  isUnavailable: boolean;
};

export type OrganizerStats = {
  totalItems: number;
  totalDurationMs: number;
  trackCount: number;
  episodeCount: number;
  duplicateGroupCount: number;
  duplicateItemCount: number;
  unavailableItemCount: number;
};

export type OrganizerPayloadBase = {
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  authState: DashboardAuthState;
  reason?: DashboardAuthReason;
  error?: string;
};

export type OrganizerPlaylistListPayload = OrganizerPayloadBase & {
  playlists: OrganizerPlaylistSummary[];
};

export type OrganizerPlaylistDetailPayload = OrganizerPayloadBase & {
  playlist?: OrganizerPlaylistSummary;
  items: OrganizerPlaylistItem[];
  stats: OrganizerStats;
};

export type OrganizerMutationPayload = OrganizerPayloadBase & {
  snapshotId?: string;
  removedCount?: number;
};
