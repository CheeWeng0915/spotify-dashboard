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
  imageUrl?: string;
};

export type TopAlbum = {
  title: string;
  artist: string;
  plays: string;
  duration: string;
  imageUrl?: string;
};

export type TopArtist = {
  name: string;
  plays: string;
  duration: string;
  topTrack: string;
  imageUrl?: string;
};

export type ListeningPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type LibraryCategory = "artists" | "albums";

export type ListeningReport = {
  period: ListeningPeriod;
  heading: string;
  subheading: string;
  metrics: DashboardMetric[];
  topTracks: TopTrack[];
  topArtists: TopArtist[];
  topAlbums: TopAlbum[];
};

export type DashboardData = {
  generatedAt: string;
  profileName: string;
  profileImageUrl?: string;
  profileUrl?: string;
  reports: ListeningReport[];
};
