export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  description: string;
};

export type TopTrack = {
  title: string;
  artist: string;
  album: string;
  detail: string;
  imageUrl?: string;
  spotifyUrl?: string;
};

export type DashboardConnection = {
  isConfigured: boolean;
  isConnected: boolean;
  isLive: boolean;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  product?: string;
  message: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  topTracks: TopTrack[];
  connection: DashboardConnection;
};
