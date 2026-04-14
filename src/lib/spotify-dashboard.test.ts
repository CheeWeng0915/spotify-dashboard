import { describe, expect, it } from "vitest";
import { createDashboardDataFromSpotify } from "@/lib/spotify-dashboard";

const profile = {
  id: "tester",
  display_name: "Tester",
};

const topTracks = {
  shortTerm: {
    items: [
      {
        id: "fallback-1",
        name: "Fallback Song 1",
        duration_ms: 200000,
        popularity: 80,
        album: { id: "fallback-album-1", name: "Fallback Album 1" },
        artists: [{ name: "Fallback Artist 1" }],
      },
      {
        id: "fallback-2",
        name: "Fallback Song 2",
        duration_ms: 180000,
        popularity: 75,
        album: { id: "fallback-album-2", name: "Fallback Album 2" },
        artists: [{ name: "Fallback Artist 2" }],
      },
    ],
  },
  mediumTerm: {
    items: [
      {
        id: "medium-1",
        name: "Medium Song 1",
        duration_ms: 220000,
        popularity: 84,
        album: { id: "medium-album-1", name: "Medium Album 1" },
        artists: [{ name: "Medium Artist 1" }],
      },
    ],
  },
  longTerm: {
    items: [
      {
        id: "long-1",
        name: "Long Song 1",
        duration_ms: 240000,
        popularity: 88,
        album: { id: "long-album-1", name: "Long Album 1" },
        artists: [{ name: "Long Artist 1" }],
      },
    ],
  },
};

const topArtists = {
  shortTerm: {
    items: [
      { id: "artist-a", name: "Artist A" },
      { id: "artist-b", name: "Artist B" },
    ],
  },
  mediumTerm: {
    items: [{ id: "artist-c", name: "Artist C" }],
  },
  longTerm: {
    items: [{ id: "artist-d", name: "Artist D" }],
  },
};

describe("createDashboardDataFromSpotify", () => {
  it("builds daily/weekly/monthly/yearly reports from recently played history", () => {
    const now = new Date("2026-04-13T12:00:00.000Z");
    const recentlyPlayed = [
      {
        played_at: "2026-04-13T11:00:00.000Z",
        track: {
          id: "a",
          name: "Song A",
          duration_ms: 180000,
          album: { id: "album-a", name: "Album A" },
          artists: [{ name: "Artist A" }],
        },
      },
      {
        played_at: "2026-04-13T10:00:00.000Z",
        track: {
          id: "a",
          name: "Song A",
          duration_ms: 180000,
          album: { id: "album-a", name: "Album A" },
          artists: [{ name: "Artist A" }],
        },
      },
      {
        played_at: "2026-04-10T10:00:00.000Z",
        track: {
          id: "b",
          name: "Song B",
          duration_ms: 240000,
          album: { id: "album-b", name: "Album B" },
          artists: [{ name: "Artist B" }],
        },
      },
      {
        played_at: "2026-04-01T10:00:00.000Z",
        track: {
          id: "c",
          name: "Song C",
          duration_ms: 200000,
          album: { id: "album-c", name: "Album C" },
          artists: [{ name: "Artist C" }],
        },
      },
      {
        played_at: "2026-03-01T10:00:00.000Z",
        track: {
          id: "d",
          name: "Song D",
          duration_ms: 210000,
          album: { id: "album-d", name: "Album D" },
          artists: [{ name: "Artist D" }],
        },
      },
      {
        played_at: "2025-11-01T10:00:00.000Z",
        track: {
          id: "e",
          name: "Song E",
          duration_ms: 150000,
          album: { id: "album-e", name: "Album E" },
          artists: [{ name: "Artist E" }],
        },
      },
    ];

    const data = createDashboardDataFromSpotify({
      profile,
      topTracks,
      topArtists,
      recentlyPlayed,
      now,
    });

    expect(data.profileName).toBe("Tester");
    expect(data.reports).toHaveLength(4);
    expect(data.reports.map((report) => report.period)).toEqual([
      "daily",
      "weekly",
      "monthly",
      "yearly",
    ]);

    const daily = data.reports[0];
    expect(daily.metrics[0].value).toBe("6m");
    expect(daily.metrics[1].value).toBe("2 plays");
    expect(daily.topTracks[0].title).toBe("Song A");
    expect(daily.topTracks[0].plays).toBe("2 plays");
    expect(daily.topArtists[0].name).toBe("Artist A");

    const weekly = data.reports[1];
    expect(weekly.metrics[0].value).toBe("10m");
    expect(weekly.metrics[1].value).toBe("3 plays");
    expect(weekly.topAlbums[0].title).toBe("Album A");
    expect(weekly.topArtists[0].topTrack).toBe("Song A");

    const yearly = data.reports[3];
    expect(yearly.metrics[1].value).toBe("6 plays");
    expect(yearly.topTracks[0].title).toBe("Song A");
    expect(yearly.topTracks[0].duration).toBe("6m");
    expect(yearly.topArtists[0].plays).toBe("2 plays");
  });

  it("falls back to period rankings when recent history is too short", () => {
    const now = new Date("2026-04-13T12:00:00.000Z");
    const recentlyPlayed = [
      {
        played_at: "2026-04-13T11:30:00.000Z",
        track: {
          id: "a",
          name: "Song A",
          duration_ms: 180000,
          album: { id: "album-a", name: "Album A" },
          artists: [{ name: "Artist A" }],
        },
      },
      {
        played_at: "2026-04-13T11:00:00.000Z",
        track: {
          id: "a",
          name: "Song A",
          duration_ms: 180000,
          album: { id: "album-a", name: "Album A" },
          artists: [{ name: "Artist A" }],
        },
      },
    ];

    const data = createDashboardDataFromSpotify({
      profile,
      topTracks,
      topArtists,
      recentlyPlayed,
      now,
    });

    expect(data.reports[0].topTracks[0].title).toBe("Song A");
    expect(data.reports[1].topTracks[0].title).toBe("Fallback Song 1");
    expect(data.reports[2].topTracks[0].title).toBe("Medium Song 1");
    expect(data.reports[3].topTracks[0].title).toBe("Long Song 1");
  });

  it("selects an artist top track based on highest play count", () => {
    const now = new Date("2026-04-13T12:00:00.000Z");
    const recentlyPlayed = [
      {
        played_at: "2026-04-13T11:50:00.000Z",
        track: {
          id: "song-a",
          name: "Song A",
          duration_ms: 180000,
          album: { id: "album-a", name: "Album A" },
          artists: [{ name: "Artist A" }],
        },
      },
      {
        played_at: "2026-04-13T11:40:00.000Z",
        track: {
          id: "song-b",
          name: "Song B",
          duration_ms: 190000,
          album: { id: "album-b", name: "Album B" },
          artists: [{ name: "Artist A" }],
        },
      },
      {
        played_at: "2026-04-13T11:30:00.000Z",
        track: {
          id: "song-b",
          name: "Song B",
          duration_ms: 190000,
          album: { id: "album-b", name: "Album B" },
          artists: [{ name: "Artist A" }],
        },
      },
      {
        played_at: "2026-04-13T11:20:00.000Z",
        track: {
          id: "song-b",
          name: "Song B",
          duration_ms: 190000,
          album: { id: "album-b", name: "Album B" },
          artists: [{ name: "Artist A" }],
        },
      },
    ];

    const data = createDashboardDataFromSpotify({
      profile,
      topTracks,
      topArtists,
      recentlyPlayed,
      now,
    });

    expect(data.reports[0].topArtists[0].name).toBe("Artist A");
    expect(data.reports[0].topArtists[0].topTrack).toBe("Song B");
  });

  it("caps top lists to keep report payloads bounded", () => {
    const now = new Date("2026-04-13T12:00:00.000Z");
    const recentlyPlayed = Array.from({ length: 25 }, (_, index) => ({
      played_at: new Date(now.getTime() - index * 60 * 60 * 1000).toISOString(),
      track: {
        id: `track-${index}`,
        name: `Track ${index}`,
        duration_ms: 180000 + index,
        album: {
          id: `album-${index}`,
          name: `Album ${index}`,
        },
        artists: [{ name: `Artist ${index}` }],
      },
    }));

    const data = createDashboardDataFromSpotify({
      profile,
      topTracks,
      topArtists,
      recentlyPlayed,
      now,
    });

    expect(data.reports[0].topTracks).toHaveLength(20);
    expect(data.reports[0].topAlbums).toHaveLength(20);
    expect(data.reports[0].topArtists).toHaveLength(20);
  });
});
