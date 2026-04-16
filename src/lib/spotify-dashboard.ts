import type {
  SpotifyCurrentlyPlayingResponse,
  SpotifyProfile,
  SpotifyRecentlyPlayedItem,
  SpotifyTopArtistsResponse,
  SpotifyTopTracksResponse,
} from "@/lib/spotify-api";
import { createNowPlayingTrack } from "@/lib/spotify-now-playing";
import type {
  DashboardData,
  ListeningPeriod,
  ListeningReport,
  TopAlbum,
  TopArtist,
  TopTrack,
} from "@/types/dashboard";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(durationMs: number) {
  if (durationMs <= 0) {
    return "0m";
  }

  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${totalMinutes}m`;
}

function pickImageUrl(
  images: Array<{ url: string }> | undefined,
): string | undefined {
  return images?.[0]?.url;
}

function buildArtistImageLookup(response: SpotifyTopArtistsResponse) {
  const imageByName = new Map<string, string | undefined>();

  for (const artist of response.items) {
    imageByName.set(artist.name, pickImageUrl(artist.images));
  }

  return imageByName;
}

type SpotifyDashboardInput = {
  profile: SpotifyProfile;
  topTracks: {
    shortTerm: SpotifyTopTracksResponse;
    mediumTerm: SpotifyTopTracksResponse;
    longTerm: SpotifyTopTracksResponse;
  };
  topArtists: {
    shortTerm: SpotifyTopArtistsResponse;
    mediumTerm: SpotifyTopArtistsResponse;
    longTerm: SpotifyTopArtistsResponse;
  };
  recentlyPlayed: SpotifyRecentlyPlayedItem[];
  currentlyPlaying?: SpotifyCurrentlyPlayingResponse | null;
  now?: Date;
};

type AggregatedTrack = {
  key: string;
  title: string;
  artist: string;
  album: string;
  plays: number;
  durationMs: number;
  imageUrl?: string;
};

type AggregatedAlbum = {
  key: string;
  title: string;
  artist: string;
  plays: number;
  durationMs: number;
  imageUrl?: string;
};

type AggregatedArtist = {
  key: string;
  name: string;
  plays: number;
  durationMs: number;
  topTrack: string;
  topTrackPlays: number;
  imageUrl?: string;
};

type PeriodConfig = {
  period: ListeningPeriod;
  heading: string;
  subheading: string;
  delta: string;
  windowMs: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_RECENT_COVERAGE_RATIO = 0.35;
const MAX_TOP_LIST_ITEMS = 20;

function incrementArtistTrackPlays(
  artistTrackPlaysByArtist: Map<string, Map<string, number>>,
  artistKey: string,
  trackTitle: string,
) {
  const trackPlaysByTitle =
    artistTrackPlaysByArtist.get(artistKey) ?? new Map<string, number>();
  const nextPlays = (trackPlaysByTitle.get(trackTitle) ?? 0) + 1;

  trackPlaysByTitle.set(trackTitle, nextPlays);
  artistTrackPlaysByArtist.set(artistKey, trackPlaysByTitle);

  return nextPlays;
}

const PERIODS: PeriodConfig[] = [
  {
    period: "daily",
    heading: "Daily Report",
    subheading: "Listening stats for the last 24 hours",
    delta: "24-hour rolling window",
    windowMs: DAY_MS,
  },
  {
    period: "weekly",
    heading: "Weekly Report",
    subheading: "Your most played tracks and albums over the last 7 days",
    delta: "7-day rolling window",
    windowMs: DAY_MS * 7,
  },
  {
    period: "monthly",
    heading: "Monthly Report",
    subheading: "30-day listening trends and summary",
    delta: "30-day rolling window",
    windowMs: DAY_MS * 30,
  },
  {
    period: "yearly",
    heading: "Yearly Report (Wrapped Style)",
    subheading: "Your annual listening summary for the last 365 days",
    delta: "365-day rolling window",
    windowMs: DAY_MS * 365,
  },
];

function sortByPlaysAndDuration<T extends { plays: number; durationMs: number }>(
  rows: T[],
  getLabel: (row: T) => string,
) {
  return rows.sort(
    (left, right) =>
      right.plays - left.plays ||
      right.durationMs - left.durationMs ||
      getLabel(left).localeCompare(getLabel(right), "en-US"),
  );
}

function getRecentHistorySpanMs(
  items: SpotifyRecentlyPlayedItem[],
  nowMs: number,
) {
  let oldestPlayedAt = Number.POSITIVE_INFINITY;

  for (const item of items) {
    const playedAt = Date.parse(item.played_at);

    if (Number.isNaN(playedAt)) {
      continue;
    }

    oldestPlayedAt = Math.min(oldestPlayedAt, playedAt);
  }

  if (!Number.isFinite(oldestPlayedAt)) {
    return 0;
  }

  return Math.max(0, nowMs - oldestPlayedAt);
}

function aggregateFromRecentlyPlayed(
  items: SpotifyRecentlyPlayedItem[],
  windowStartMs: number,
  artistImageLookup: Map<string, string | undefined>,
) {
  const trackMap = new Map<string, AggregatedTrack>();
  const albumMap = new Map<string, AggregatedAlbum>();
  const artistMap = new Map<string, AggregatedArtist>();
  const artistTrackPlaysByArtist = new Map<string, Map<string, number>>();
  let totalDurationMs = 0;
  let totalPlays = 0;

  for (const item of items) {
    const playedAt = Date.parse(item.played_at);

    if (Number.isNaN(playedAt) || playedAt < windowStartMs) {
      continue;
    }

    const artists = item.track.artists.map((artist) => artist.name).join(", ");
    const trackKey = item.track.id || `${item.track.name}:${artists}`;
    const albumKey = item.track.album.id || `${item.track.album.name}:${artists}`;
    const trackImageUrl = pickImageUrl(item.track.album.images);

    totalPlays += 1;
    totalDurationMs += item.track.duration_ms;

    const existingTrack = trackMap.get(trackKey);
    if (existingTrack) {
      existingTrack.plays += 1;
      existingTrack.durationMs += item.track.duration_ms;
    } else {
      trackMap.set(trackKey, {
        key: trackKey,
        title: item.track.name,
        artist: artists,
        album: item.track.album.name,
        plays: 1,
        durationMs: item.track.duration_ms,
        imageUrl: trackImageUrl,
      });
    }

    const existingAlbum = albumMap.get(albumKey);
    if (existingAlbum) {
      existingAlbum.plays += 1;
      existingAlbum.durationMs += item.track.duration_ms;
    } else {
      albumMap.set(albumKey, {
        key: albumKey,
        title: item.track.album.name,
        artist: artists,
        plays: 1,
        durationMs: item.track.duration_ms,
        imageUrl: trackImageUrl,
      });
    }

    for (const artist of item.track.artists) {
      const artistKey = artist.name;
      const existingArtist = artistMap.get(artistKey);
      const trackPlays = incrementArtistTrackPlays(
        artistTrackPlaysByArtist,
        artistKey,
        item.track.name,
      );

      if (existingArtist) {
        existingArtist.plays += 1;
        existingArtist.durationMs += item.track.duration_ms;
        if (trackPlays > existingArtist.topTrackPlays) {
          existingArtist.topTrack = item.track.name;
          existingArtist.topTrackPlays = trackPlays;
        }
      } else {
        artistMap.set(artistKey, {
          key: artistKey,
          name: artist.name,
          plays: 1,
          durationMs: item.track.duration_ms,
          topTrack: item.track.name,
          topTrackPlays: trackPlays,
          imageUrl: artistImageLookup.get(artist.name),
        });
      }
    }
  }

  return {
    totalDurationMs,
    totalPlays,
    uniqueTracks: trackMap.size,
    uniqueAlbums: albumMap.size,
    uniqueArtists: artistMap.size,
    tracks: sortByPlaysAndDuration(Array.from(trackMap.values()), (track) => track.title),
    albums: sortByPlaysAndDuration(Array.from(albumMap.values()), (album) => album.title),
    artists: sortByPlaysAndDuration(Array.from(artistMap.values()), (artist) => artist.name),
  };
}

function formatTopTracksFromAggregate(rows: AggregatedTrack[]): TopTrack[] {
  return rows.slice(0, MAX_TOP_LIST_ITEMS).map((row) => ({
    title: row.title,
    artist: row.artist,
    album: row.album,
    plays: `${formatNumber(row.plays)} plays`,
    duration: formatDuration(row.durationMs),
    imageUrl: row.imageUrl,
  }));
}

function formatTopAlbumsFromAggregate(rows: AggregatedAlbum[]): TopAlbum[] {
  return rows.slice(0, MAX_TOP_LIST_ITEMS).map((row) => ({
    title: row.title,
    artist: row.artist,
    plays: `${formatNumber(row.plays)} plays`,
    duration: formatDuration(row.durationMs),
    imageUrl: row.imageUrl,
  }));
}

function formatTopArtistsFromAggregate(rows: AggregatedArtist[]): TopArtist[] {
  return rows.slice(0, MAX_TOP_LIST_ITEMS).map((row) => ({
    name: row.name,
    plays: `${formatNumber(row.plays)} plays`,
    duration: formatDuration(row.durationMs),
    topTrack: row.topTrack,
    imageUrl: row.imageUrl,
  }));
}

function aggregateFromTopTracks(response: SpotifyTopTracksResponse) {
  const trackRows: AggregatedTrack[] = response.items.map((track) => ({
    key: track.id,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    album: track.album.name,
    plays: 1,
    durationMs: track.duration_ms,
    imageUrl: pickImageUrl(track.album.images),
  }));
  const albumMap = new Map<string, AggregatedAlbum>();
  const artistMap = new Map<string, AggregatedArtist>();
  const artistTrackPlaysByArtist = new Map<string, Map<string, number>>();

  for (const track of response.items) {
    const artists = track.artists.map((artist) => artist.name).join(", ");
    const albumKey = `${track.album.name}:${artists}`;
    const existingAlbum = albumMap.get(albumKey);

    if (existingAlbum) {
      existingAlbum.plays += 1;
      existingAlbum.durationMs += track.duration_ms;
    } else {
      albumMap.set(albumKey, {
        key: albumKey,
        title: track.album.name,
        artist: artists,
        plays: 1,
        durationMs: track.duration_ms,
        imageUrl: pickImageUrl(track.album.images),
      });
    }

    for (const artist of track.artists) {
      const artistKey = artist.name;
      const existingArtist = artistMap.get(artistKey);
      const trackPlays = incrementArtistTrackPlays(
        artistTrackPlaysByArtist,
        artistKey,
        track.name,
      );

      if (existingArtist) {
        existingArtist.plays += 1;
        existingArtist.durationMs += track.duration_ms;
        if (trackPlays > existingArtist.topTrackPlays) {
          existingArtist.topTrack = track.name;
          existingArtist.topTrackPlays = trackPlays;
        }
      } else {
        artistMap.set(artistKey, {
          key: artistKey,
          name: artist.name,
          plays: 1,
          durationMs: track.duration_ms,
          topTrack: track.name,
          topTrackPlays: trackPlays,
        });
      }
    }
  }

  const totalDurationMs = trackRows.reduce(
    (sum, track) => sum + track.durationMs,
    0,
  );

  return {
    totalDurationMs,
    totalPlays: trackRows.length,
    uniqueTracks: trackRows.length,
    uniqueAlbums: albumMap.size,
    uniqueArtists: artistMap.size,
    tracks: sortByPlaysAndDuration(trackRows, (track) => track.title),
    albums: sortByPlaysAndDuration(Array.from(albumMap.values()), (album) => album.title),
    artists: sortByPlaysAndDuration(Array.from(artistMap.values()), (artist) => artist.name),
  };
}

function formatTopTracksFromSpotifyFallback(
  response: SpotifyTopTracksResponse,
): TopTrack[] {
  return response.items.slice(0, MAX_TOP_LIST_ITEMS).map((track, index) => ({
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    album: track.album.name,
    plays: `Top #${index + 1}`,
    duration: formatDuration(track.duration_ms),
    imageUrl: pickImageUrl(track.album.images),
  }));
}

function formatTopAlbumsFromSpotifyFallback(
  response: SpotifyTopTracksResponse,
): TopAlbum[] {
  const albumMap = new Map<string, AggregatedAlbum>();

  for (const track of response.items) {
    const artists = track.artists.map((artist) => artist.name).join(", ");
    const albumKey = track.album.id || `${track.album.name}:${artists}`;
    const existingAlbum = albumMap.get(albumKey);

    if (existingAlbum) {
      existingAlbum.plays += 1;
      existingAlbum.durationMs += track.duration_ms;
    } else {
      albumMap.set(albumKey, {
        key: albumKey,
        title: track.album.name,
        artist: artists,
        plays: 1,
        durationMs: track.duration_ms,
        imageUrl: pickImageUrl(track.album.images),
      });
    }
  }

  return sortByPlaysAndDuration(Array.from(albumMap.values()), (album) => album.title)
    .slice(0, MAX_TOP_LIST_ITEMS)
    .map((album, index) => ({
      title: album.title,
      artist: album.artist,
      plays: `Top #${index + 1}`,
      duration: formatDuration(album.durationMs),
      imageUrl: album.imageUrl,
    }));
}

function formatTopArtistsFromSpotifyFallback(
  response: SpotifyTopArtistsResponse,
): TopArtist[] {
  return response.items.slice(0, MAX_TOP_LIST_ITEMS).map((artist, index) => ({
    name: artist.name,
    plays: `Top #${index + 1}`,
    duration: "-",
    topTrack: "Top artist ranking",
    imageUrl: pickImageUrl(artist.images),
  }));
}

function buildPeriodReport(
  config: PeriodConfig,
  nowMs: number,
  recentHistorySpanMs: number,
  recentlyPlayed: SpotifyRecentlyPlayedItem[],
  fallbackTracks: SpotifyTopTracksResponse,
  fallbackArtists: SpotifyTopArtistsResponse,
  artistImageLookup: Map<string, string | undefined>,
): ListeningReport {
  const recentSummary = aggregateFromRecentlyPlayed(
    recentlyPlayed,
    nowMs - config.windowMs,
    artistImageLookup,
  );
  const hasAdequateRecentCoverage =
    recentHistorySpanMs / config.windowMs >= MIN_RECENT_COVERAGE_RATIO;
  const useRecentSummary =
    recentSummary.totalPlays > 0 &&
    (config.period === "daily" || hasAdequateRecentCoverage);
  const summary = useRecentSummary
    ? recentSummary
    : aggregateFromTopTracks(fallbackTracks);
  const topTrack = summary.tracks[0];
  const topTracks =
    useRecentSummary && summary.tracks.length > 0
      ? formatTopTracksFromAggregate(summary.tracks)
      : formatTopTracksFromSpotifyFallback(fallbackTracks);
  const topAlbums =
    useRecentSummary && summary.albums.length > 0
      ? formatTopAlbumsFromAggregate(summary.albums)
      : formatTopAlbumsFromSpotifyFallback(fallbackTracks);
  const topArtists =
    useRecentSummary && summary.artists.length > 0
      ? formatTopArtistsFromAggregate(summary.artists)
      : formatTopArtistsFromSpotifyFallback(fallbackArtists);
  const spotlightLabel =
    config.period === "yearly" ? "Song of the Year" : "Most Played Song";
  const spotlightDescription = topTrack
    ? `${topTrack.artist} · ${topTrack.album}`
    : "No recent listening history.";
  const durationDescription = useRecentSummary
    ? "Calculated by summing track durations from play history."
    : "Estimated from Top Tracks when recent play history is unavailable.";
  const playsDescription = useRecentSummary
    ? `${formatNumber(summary.uniqueAlbums)} unique albums · ${formatNumber(
        summary.uniqueArtists,
      )} unique artists`
    : "Currently estimated from rankings. Reconnect authorization for precise stats.";

  return {
    period: config.period,
    heading: config.heading,
    subheading: config.subheading,
    metrics: [
      {
        label: "Listening Time",
        value: formatDuration(summary.totalDurationMs),
        delta: config.delta,
        description: durationDescription,
      },
      {
        label: "Play Count",
        value: `${formatNumber(summary.totalPlays)} plays`,
        delta: `${formatNumber(summary.uniqueTracks)} unique tracks`,
        description: playsDescription,
      },
      {
        label: spotlightLabel,
        value: topTrack?.title ?? "No data",
        delta: topTrack
          ? `${formatNumber(topTrack.plays)} plays`
          : "Waiting for more listening data",
        description: spotlightDescription,
      },
    ],
    topTracks,
    topArtists,
    topAlbums,
  };
}

export function createDashboardDataFromSpotify({
  profile,
  topTracks,
  topArtists,
  recentlyPlayed,
  currentlyPlaying,
  now = new Date(),
}: SpotifyDashboardInput): DashboardData {
  const displayName = profile.display_name ?? profile.id;
  const nowMs = now.getTime();
  const recentHistorySpanMs = getRecentHistorySpanMs(recentlyPlayed, nowMs);
  const shortTermArtistImages = buildArtistImageLookup(topArtists.shortTerm);
  const mediumTermArtistImages = buildArtistImageLookup(topArtists.mediumTerm);
  const longTermArtistImages = buildArtistImageLookup(topArtists.longTerm);

  return {
    generatedAt: now.toISOString(),
    profileName: displayName,
    profileImageUrl: pickImageUrl(profile.images),
    profileUrl: profile.external_urls?.spotify,
    nowPlaying: createNowPlayingTrack(currentlyPlaying),
    reports: [
      buildPeriodReport(
        PERIODS[0],
        nowMs,
        recentHistorySpanMs,
        recentlyPlayed,
        topTracks.shortTerm,
        topArtists.shortTerm,
        shortTermArtistImages,
      ),
      buildPeriodReport(
        PERIODS[1],
        nowMs,
        recentHistorySpanMs,
        recentlyPlayed,
        topTracks.shortTerm,
        topArtists.shortTerm,
        shortTermArtistImages,
      ),
      buildPeriodReport(
        PERIODS[2],
        nowMs,
        recentHistorySpanMs,
        recentlyPlayed,
        topTracks.mediumTerm,
        topArtists.mediumTerm,
        mediumTermArtistImages,
      ),
      buildPeriodReport(
        PERIODS[3],
        nowMs,
        recentHistorySpanMs,
        recentlyPlayed,
        topTracks.longTerm,
        topArtists.longTerm,
        longTermArtistImages,
      ),
    ],
  };
}
