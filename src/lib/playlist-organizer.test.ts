import { describe, expect, it } from "vitest";
import {
  calculateOrganizerStats,
  createOrganizerRows,
  getPlaylistUrisAfterRemoval,
} from "@/lib/playlist-organizer";

describe("playlist organizer helpers", () => {
  it("marks duplicate rows after the first matching URI", () => {
    const rows = createOrganizerRows([
      {
        position: 0,
        type: "track",
        title: "Song",
        subtitle: "Artist",
        albumOrShow: "Album",
        durationMs: 1000,
        uri: "spotify:track:abc",
        isUnavailable: false,
      },
      {
        position: 1,
        type: "track",
        title: "Song",
        subtitle: "Artist",
        albumOrShow: "Album",
        durationMs: 1000,
        uri: "spotify:track:abc",
        isUnavailable: false,
      },
    ]);

    expect(rows[0].isDuplicate).toBe(false);
    expect(rows[1].isDuplicate).toBe(true);
  });

  it("calculates playlist cleanup stats", () => {
    const rows = createOrganizerRows([
      {
        position: 0,
        type: "track",
        title: "Song",
        subtitle: "Artist",
        albumOrShow: "Album",
        durationMs: 1000,
        uri: "spotify:track:abc",
        isUnavailable: false,
      },
      {
        position: 1,
        type: "episode",
        title: "Episode",
        subtitle: "Show",
        albumOrShow: "Show",
        durationMs: 2000,
        uri: "spotify:episode:def",
        isUnavailable: false,
      },
      {
        position: 2,
        type: "unknown",
        title: "Unavailable item",
        subtitle: "Unavailable",
        albumOrShow: "Unavailable",
        durationMs: 0,
        isUnavailable: true,
      },
    ]);

    expect(calculateOrganizerStats(rows)).toMatchObject({
      totalItems: 3,
      totalDurationMs: 3000,
      trackCount: 1,
      episodeCount: 1,
      unavailableItemCount: 1,
    });
  });

  it("returns remaining Spotify URIs after selected row removal", () => {
    const rows = createOrganizerRows([
      {
        position: 0,
        type: "track",
        title: "Keep",
        subtitle: "Artist",
        albumOrShow: "Album",
        durationMs: 1000,
        uri: "spotify:track:keep",
        isUnavailable: false,
      },
      {
        position: 1,
        type: "track",
        title: "Remove",
        subtitle: "Artist",
        albumOrShow: "Album",
        durationMs: 1000,
        uri: "spotify:track:remove",
        isUnavailable: false,
      },
    ]);

    expect(getPlaylistUrisAfterRemoval(rows, [rows[1].rowId])).toEqual({
      removedCount: 1,
      remainingUris: ["spotify:track:keep"],
      unselectedInvalidCount: 0,
    });
  });
});
