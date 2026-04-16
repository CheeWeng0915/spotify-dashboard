import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/spotify", async () => {
  const actual = await vi.importActual<typeof import("@/lib/spotify")>("@/lib/spotify");

  return {
    ...actual,
    getSpotifyConfig: vi.fn(),
  };
});

vi.mock("@/lib/spotify-route-auth", () => ({
  applySpotifySessionResponseCookies: vi.fn(),
  classifySpotifyRequestError: vi.fn(),
  resolveSpotifyRouteSession: vi.fn(),
}));

vi.mock("@/lib/spotify-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/spotify-api")>(
    "@/lib/spotify-api",
  );

  return {
    ...actual,
    getCurrentSpotifyProfile: vi.fn(),
    getCurrentUserPlaylists: vi.fn(),
    getSpotifyPlaylist: vi.fn(),
    getSpotifyPlaylistItems: vi.fn(),
    replaceSpotifyPlaylistItems: vi.fn(),
  };
});

import { GET as GET_PLAYLISTS } from "@/app/api/organizer/playlists/route";
import {
  GET as GET_PLAYLIST_DETAIL,
  PATCH as CLEAN_PLAYLIST,
} from "@/app/api/organizer/playlists/[playlistId]/route";
import { getSpotifyConfig } from "@/lib/spotify";
import {
  getCurrentSpotifyProfile,
  getCurrentUserPlaylists,
  getSpotifyPlaylist,
  getSpotifyPlaylistItems,
  replaceSpotifyPlaylistItems,
} from "@/lib/spotify-api";
import {
  applySpotifySessionResponseCookies,
  classifySpotifyRequestError,
  resolveSpotifyRouteSession,
} from "@/lib/spotify-route-auth";

const mockedGetSpotifyConfig = vi.mocked(getSpotifyConfig);
const mockedResolveSpotifyRouteSession = vi.mocked(resolveSpotifyRouteSession);
const mockedApplySpotifySessionResponseCookies = vi.mocked(applySpotifySessionResponseCookies);
const mockedClassifySpotifyRequestError = vi.mocked(classifySpotifyRequestError);
const mockedGetCurrentSpotifyProfile = vi.mocked(getCurrentSpotifyProfile);
const mockedGetCurrentUserPlaylists = vi.mocked(getCurrentUserPlaylists);
const mockedGetSpotifyPlaylist = vi.mocked(getSpotifyPlaylist);
const mockedGetSpotifyPlaylistItems = vi.mocked(getSpotifyPlaylistItems);
const mockedReplaceSpotifyPlaylistItems = vi.mocked(replaceSpotifyPlaylistItems);

function createContext(playlistId = "playlist-1") {
  return {
    params: Promise.resolve({
      playlistId,
    }),
  };
}

function createPatchRequest(body: unknown) {
  return new Request("http://localhost/api/organizer/playlists/playlist-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function createTrack(uri: string, name: string) {
  return {
    type: "track",
    uri,
    name,
    duration_ms: 1000,
    external_urls: {
      spotify: `https://open.spotify.com/track/${uri.split(":").at(-1)}`,
    },
    album: {
      name: "Album",
      images: [{ url: "https://example.com/cover.jpg" }],
    },
    artists: [{ name: "Artist" }],
  };
}

describe("/api/organizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedApplySpotifySessionResponseCookies.mockImplementation(() => {});
    mockedClassifySpotifyRequestError.mockReturnValue({
      authState: "transient_error",
      reason: "spotify_upstream_error",
      clearSession: false,
      error: "spotify_upstream_error",
    });
    mockedGetSpotifyConfig.mockReturnValue({
      appUrl: "http://127.0.0.1:3000",
      clientId: "client-id",
      isConfigured: true,
      missing: [],
      redirectUri: "http://127.0.0.1:3000/api/auth/callback/spotify",
      scopes: [],
    });
    mockedResolveSpotifyRouteSession.mockResolvedValue({
      kind: "ready",
      session: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        tokenType: "Bearer",
        scope:
          "playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public",
        expiresAt: Date.now() + 60_000,
        sessionExpiresAt: Date.now() + 86_400_000,
      },
    });
    mockedGetCurrentSpotifyProfile.mockResolvedValue({
      id: "user-1",
      display_name: "Listener",
    });
    mockedGetCurrentUserPlaylists.mockResolvedValue({
      next: null,
      items: [
        {
          id: "playlist-1",
          name: "Owned",
          uri: "spotify:playlist:playlist-1",
          snapshot_id: "snapshot-1",
          owner: {
            id: "user-1",
            display_name: "Listener",
          },
          tracks: {
            total: 3,
          },
        },
        {
          id: "playlist-2",
          name: "Read Only",
          uri: "spotify:playlist:playlist-2",
          owner: {
            id: "other-user",
            display_name: "Other",
          },
          tracks: {
            total: 4,
          },
        },
      ],
    });
    mockedGetSpotifyPlaylist.mockResolvedValue({
      id: "playlist-1",
      name: "Owned",
      uri: "spotify:playlist:playlist-1",
      snapshot_id: "snapshot-1",
      owner: {
        id: "user-1",
        display_name: "Listener",
      },
      tracks: {
        total: 3,
      },
    });
    mockedGetSpotifyPlaylistItems.mockResolvedValue({
      next: null,
      items: [
        {
          track: createTrack("spotify:track:abc", "Song"),
        },
        {
          track: createTrack("spotify:track:abc", "Song Copy"),
        },
        {
          track: null,
        },
      ],
    });
    mockedReplaceSpotifyPlaylistItems.mockResolvedValue({
      snapshot_id: "snapshot-2",
    });
  });

  it("lists only playlists the current user can edit", async () => {
    const response = await GET_PLAYLISTS();
    const body = await response.json();

    expect(body.authState).toBe("connected");
    expect(body.playlists).toHaveLength(1);
    expect(body.playlists[0]).toMatchObject({
      id: "playlist-1",
      name: "Owned",
      totalItems: 3,
    });
  });

  it("surfaces missing playlist scopes as reconnect", async () => {
    mockedResolveSpotifyRouteSession.mockResolvedValueOnce({
      kind: "needs_reauth",
      reason: "missing_scope",
      clearSession: false,
      error: "spotify_reauth_required",
    });

    const response = await GET_PLAYLISTS();
    const body = await response.json();

    expect(body.authState).toBe("needs_reauth");
    expect(body.reason).toBe("missing_scope");
  });

  it("loads playlist items with duplicate and unavailable stats", async () => {
    const response = await GET_PLAYLIST_DETAIL(
      new Request("http://localhost/api/organizer/playlists/playlist-1"),
      createContext(),
    );
    const body = await response.json();

    expect(body.stats).toMatchObject({
      totalItems: 3,
      duplicateGroupCount: 1,
      duplicateItemCount: 1,
      unavailableItemCount: 1,
    });
    expect(body.items[1]).toMatchObject({
      rowId: "1:spotify:track:abc",
      isDuplicate: true,
    });
  });

  it("rewrites a playlist after confirmed selected row cleanup", async () => {
    mockedGetSpotifyPlaylistItems.mockResolvedValueOnce({
      next: null,
      items: [
        {
          track: createTrack("spotify:track:abc", "Song"),
        },
        {
          track: createTrack("spotify:track:abc", "Song Copy"),
        },
        {
          track: createTrack("spotify:track:def", "Other Song"),
        },
      ],
    });

    const response = await CLEAN_PLAYLIST(
      createPatchRequest({
        confirm: true,
        snapshotId: "snapshot-1",
        selectedRowIds: ["1:spotify:track:abc"],
      }),
      createContext(),
    );
    const body = await response.json();

    expect(body.removedCount).toBe(1);
    expect(body.snapshotId).toBe("snapshot-2");
    expect(mockedReplaceSpotifyPlaylistItems).toHaveBeenCalledWith(
      "access-token",
      "playlist-1",
      ["spotify:track:abc", "spotify:track:def"],
    );
  });
});
