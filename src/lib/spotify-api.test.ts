import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentUserPlaylists,
  getSpotifyPlaylistItems,
  replaceSpotifyPlaylistItems,
  searchSpotifyCatalog,
} from "@/lib/spotify-api";

const mockedFetch = vi.fn<typeof fetch>();

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("spotify api helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockedFetch);
    mockedFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("searches catalog items with the requested Spotify types", async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse({ tracks: { items: [] } }));

    await searchSpotifyCatalog("access-token", "daft punk", ["track", "artist"], {
      limit: 12,
    });

    expect(mockedFetch).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/search?q=daft+punk&type=track%2Cartist&limit=12",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("fetches current user playlists with pagination options", async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await getCurrentUserPlaylists("access-token", {
      limit: 25,
      offset: 50,
    });

    expect(mockedFetch).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/me/playlists?limit=25&offset=50",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("fetches playlist items with a clamped page size", async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await getSpotifyPlaylistItems("access-token", "playlist-1", {
      limit: 99,
      offset: 10,
    });

    expect(mockedFetch).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/playlists/playlist-1/tracks?limit=50&offset=10",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("replaces playlist items and appends remaining chunks over 100", async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({ snapshot_id: "snapshot-1" }))
      .mockResolvedValueOnce(jsonResponse({ snapshot_id: "snapshot-2" }))
      .mockResolvedValueOnce(jsonResponse({ snapshot_id: "snapshot-3" }));
    const uris = Array.from(
      { length: 205 },
      (_, index) => `spotify:track:${String(index).padStart(3, "0")}`,
    );

    const response = await replaceSpotifyPlaylistItems(
      "access-token",
      "playlist-1",
      uris,
    );

    expect(response.snapshot_id).toBe("snapshot-3");
    expect(mockedFetch).toHaveBeenNthCalledWith(
      1,
      "https://api.spotify.com/v1/playlists/playlist-1/tracks",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          uris: uris.slice(0, 100),
        }),
      }),
    );
    expect(mockedFetch).toHaveBeenNthCalledWith(
      2,
      "https://api.spotify.com/v1/playlists/playlist-1/tracks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          uris: uris.slice(100, 200),
        }),
      }),
    );
    expect(mockedFetch).toHaveBeenNthCalledWith(
      3,
      "https://api.spotify.com/v1/playlists/playlist-1/tracks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          uris: uris.slice(200),
        }),
      }),
    );
  });
});
