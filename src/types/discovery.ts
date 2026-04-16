export type DiscoveryTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  imageUrl?: string;
  reason: string;
};

export type DiscoveryArtist = {
  id: string;
  name: string;
  imageUrl?: string;
  reason: string;
};

export type DiscoveryData = {
  generatedAt: string;
  profileName: string;
  tracks: DiscoveryTrack[];
  artists: DiscoveryArtist[];
};
