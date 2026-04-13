import type {
  SpotifyProfile,
  SpotifyRecentlyPlayedItem,
  SpotifyTopTracksResponse,
} from "@/lib/spotify-api";
import type {
  DashboardData,
  ListeningPeriod,
  ListeningReport,
  TopAlbum,
  TopTrack,
} from "@/types/dashboard";

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
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

type SpotifyDashboardInput = {
  profile: SpotifyProfile;
  topTracks: {
    shortTerm: SpotifyTopTracksResponse;
    mediumTerm: SpotifyTopTracksResponse;
    longTerm: SpotifyTopTracksResponse;
  };
  recentlyPlayed: SpotifyRecentlyPlayedItem[];
  now?: Date;
};

type AggregatedTrack = {
  key: string;
  title: string;
  artist: string;
  album: string;
  plays: number;
  durationMs: number;
};

type AggregatedAlbum = {
  key: string;
  title: string;
  artist: string;
  plays: number;
  durationMs: number;
};

type PeriodConfig = {
  period: ListeningPeriod;
  heading: string;
  subheading: string;
  delta: string;
  windowMs: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const PERIODS: PeriodConfig[] = [
  {
    period: "daily",
    heading: "今日报告",
    subheading: "过去 24 小时的收听统计",
    delta: "24 小时滚动窗口",
    windowMs: DAY_MS,
  },
  {
    period: "weekly",
    heading: "周报",
    subheading: "过去 7 天你最常听的歌曲与专辑",
    delta: "7 天滚动窗口",
    windowMs: DAY_MS * 7,
  },
  {
    period: "monthly",
    heading: "月报",
    subheading: "过去 30 天听歌趋势与月度总结",
    delta: "30 天滚动窗口",
    windowMs: DAY_MS * 30,
  },
  {
    period: "yearly",
    heading: "年报（Wrapped 风格）",
    subheading: "过去 365 天的年度收听总结",
    delta: "365 天滚动窗口",
    windowMs: DAY_MS * 365,
  },
];

function sortByPlaysAndDuration<
  T extends { title: string; plays: number; durationMs: number },
>(
  rows: T[],
) {
  return rows.sort(
    (left, right) =>
      right.plays - left.plays ||
      right.durationMs - left.durationMs ||
      left.title.localeCompare(right.title, "zh-CN"),
  );
}

function aggregateFromRecentlyPlayed(
  items: SpotifyRecentlyPlayedItem[],
  windowStartMs: number,
) {
  const trackMap = new Map<string, AggregatedTrack>();
  const albumMap = new Map<string, AggregatedAlbum>();
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
      });
    }
  }

  return {
    totalDurationMs,
    totalPlays,
    uniqueTracks: trackMap.size,
    uniqueAlbums: albumMap.size,
    tracks: sortByPlaysAndDuration(Array.from(trackMap.values())),
    albums: sortByPlaysAndDuration(Array.from(albumMap.values())),
  };
}

function formatTopTracksFromAggregate(rows: AggregatedTrack[]): TopTrack[] {
  return rows.slice(0, 5).map((row) => ({
    title: row.title,
    artist: row.artist,
    album: row.album,
    plays: `${formatNumber(row.plays)} 次`,
    duration: formatDuration(row.durationMs),
  }));
}

function formatTopAlbumsFromAggregate(rows: AggregatedAlbum[]): TopAlbum[] {
  return rows.slice(0, 5).map((row) => ({
    title: row.title,
    artist: row.artist,
    plays: `${formatNumber(row.plays)} 次`,
    duration: formatDuration(row.durationMs),
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
  }));
  const albumMap = new Map<string, AggregatedAlbum>();

  for (const track of trackRows) {
    const albumKey = `${track.album}:${track.artist}`;
    const existingAlbum = albumMap.get(albumKey);

    if (existingAlbum) {
      existingAlbum.plays += track.plays;
      existingAlbum.durationMs += track.durationMs;
    } else {
      albumMap.set(albumKey, {
        key: albumKey,
        title: track.album,
        artist: track.artist,
        plays: track.plays,
        durationMs: track.durationMs,
      });
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
    tracks: sortByPlaysAndDuration(trackRows),
    albums: sortByPlaysAndDuration(Array.from(albumMap.values())),
  };
}

function formatTopTracksFromSpotifyFallback(
  response: SpotifyTopTracksResponse,
): TopTrack[] {
  return response.items.slice(0, 5).map((track, index) => ({
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    album: track.album.name,
    plays: `Top #${index + 1}`,
    duration: formatDuration(track.duration_ms),
  }));
}

function formatTopAlbumsFromSpotifyFallback(
  response: SpotifyTopTracksResponse,
): TopAlbum[] {
  const albumMap = new Map<string, AggregatedAlbum>();

  for (const track of response.items.slice(0, 10)) {
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
      });
    }
  }

  return sortByPlaysAndDuration(Array.from(albumMap.values()))
    .slice(0, 5)
    .map((album, index) => ({
      title: album.title,
      artist: album.artist,
      plays: `Top #${index + 1}`,
      duration: formatDuration(album.durationMs),
    }));
}

function buildPeriodReport(
  config: PeriodConfig,
  nowMs: number,
  recentlyPlayed: SpotifyRecentlyPlayedItem[],
  fallbackTracks: SpotifyTopTracksResponse,
): ListeningReport {
  const recentSummary = aggregateFromRecentlyPlayed(
    recentlyPlayed,
    nowMs - config.windowMs,
  );
  const hasRecentSummary = recentSummary.totalPlays > 0;
  const summary = hasRecentSummary
    ? recentSummary
    : aggregateFromTopTracks(fallbackTracks);
  const topTrack = summary.tracks[0];
  const topTracks =
    hasRecentSummary && summary.tracks.length > 0
      ? formatTopTracksFromAggregate(summary.tracks)
      : formatTopTracksFromSpotifyFallback(fallbackTracks);
  const topAlbums =
    hasRecentSummary && summary.albums.length > 0
      ? formatTopAlbumsFromAggregate(summary.albums)
      : formatTopAlbumsFromSpotifyFallback(fallbackTracks);
  const spotlightLabel =
    config.period === "yearly" ? "年度主打歌曲" : "最多播放歌曲";
  const spotlightDescription = topTrack
    ? `${topTrack.artist} · ${topTrack.album}`
    : "暂无近期收听记录";
  const durationDescription = hasRecentSummary
    ? "按播放记录中每首歌时长累积计算。"
    : "缺少最近播放明细时，基于 Top 歌曲榜单估算。";
  const playsDescription = hasRecentSummary
    ? `${formatNumber(summary.uniqueAlbums)} 张不同专辑`
    : "当前为榜单估算值，重新授权后可切换为精确统计。";

  return {
    period: config.period,
    heading: config.heading,
    subheading: config.subheading,
    metrics: [
      {
        label: "收听时长",
        value: formatDuration(summary.totalDurationMs),
        delta: config.delta,
        description: durationDescription,
      },
      {
        label: "播放次数",
        value: `${formatNumber(summary.totalPlays)} 次`,
        delta: `${formatNumber(summary.uniqueTracks)} 首不同歌曲`,
        description: playsDescription,
      },
      {
        label: spotlightLabel,
        value: topTrack?.title ?? "暂无数据",
        delta: topTrack ? `${formatNumber(topTrack.plays)} 次` : "等待更多收听数据",
        description: spotlightDescription,
      },
    ],
    topTracks,
    topAlbums,
  };
}

export function createDashboardDataFromSpotify({
  profile,
  topTracks,
  recentlyPlayed,
  now = new Date(),
}: SpotifyDashboardInput): DashboardData {
  const displayName = profile.display_name ?? profile.id;
  const nowMs = now.getTime();

  return {
    generatedAt: now.toISOString(),
    profileName: displayName,
    reports: [
      buildPeriodReport(PERIODS[0], nowMs, recentlyPlayed, topTracks.shortTerm),
      buildPeriodReport(PERIODS[1], nowMs, recentlyPlayed, topTracks.shortTerm),
      buildPeriodReport(PERIODS[2], nowMs, recentlyPlayed, topTracks.mediumTerm),
      buildPeriodReport(PERIODS[3], nowMs, recentlyPlayed, topTracks.longTerm),
    ],
  };
}
