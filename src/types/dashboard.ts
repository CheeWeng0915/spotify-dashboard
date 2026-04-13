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
  plays: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  topTracks: TopTrack[];
};
