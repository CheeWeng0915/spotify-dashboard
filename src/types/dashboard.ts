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
  duration: string;
};

export type TopAlbum = {
  title: string;
  artist: string;
  plays: string;
  duration: string;
};

export type ListeningPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type ListeningReport = {
  period: ListeningPeriod;
  heading: string;
  subheading: string;
  metrics: DashboardMetric[];
  topTracks: TopTrack[];
  topAlbums: TopAlbum[];
};

export type DashboardData = {
  generatedAt: string;
  profileName: string;
  reports: ListeningReport[];
};
