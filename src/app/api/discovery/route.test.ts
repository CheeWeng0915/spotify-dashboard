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
    getCurrentUserRecentlyPlayed: vi.fn(),
    getCurrentUserTopArtists: vi.fn(),
    getCurrentUserTopTracks: vi.fn(),
    getSpotifyRecommendations: vi.fn(),
    searchSpotifyTracks: vi.fn(),
  };
});

import { GET } from "@/app/api/discovery/route";
import {
  getCurrentSpotifyProfile,
  getCurrentUserRecentlyPlayed,
  getCurrentUserTopArtists,
  getCurrentUserTopTracks,
  getSpotifyRecommendations,
  searchSpotifyTracks,
  SpotifyApiError,
} from "@/lib/spotify-api";
import { getSpotifyConfig } from "@/lib/spotify";
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
const mockedGetCurrentUserTopTracks = vi.mocked(getCurrentUserTopTracks);
const mockedGetCurrentUserTopArtists = vi.mocked(getCurrentUserTopArtists);
const mockedGetCurrentUserRecentlyPlayed = vi.mocked(getCurrentUserRecentlyPlayed);
const mockedGetSpotifyRecommendations = vi.mocked(getSpotifyRecommendations);
const mockedSearchSpotifyTracks = vi.mocked(searchSpotifyTracks);

describe("/api/discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockedGetSpotifyConfig.mockReturnValue({
      appUrl: "http://127.0.0.1:3000",
      clientId: "client-id",
      isConfigured: true,
      missing: [],
      redirectUri: "http://127.0.0.1:3000/api/auth/callback/spotify",
      scopes: ["user-top-read", "user-read-recently-played"],
    });

    mockedResolveSpotifyRouteSession.mockResolvedValue({
      kind: "ready",
      session: {
        accessToken: "access-token",
        expiresAt: Date.now() + 60_000,
        refreshToken: "refresh-token",
        scope: "user-top-read user-read-recently-played",
        sessionExpiresAt: Date.now() + 86_400_000,
        tokenType: "Bearer",
      },
    });

    mockedApplySpotifySessionResponseCookies.mockImplementation(() => {});
    mockedClassifySpotifyRequestError.mockReturnValue({
      authState: "transient_error",
      reason: "spotify_upstream_error",
      clearSession: false,
      error: "spotify_upstream_error",
    });

    mockedGetCurrentSpotifyProfile.mockResolvedValue({
      id: "listener-1",
      display_name: "Connected Listener",
    });
    mockedGetCurrentUserTopTracks.mockResolvedValue({
      items: [],
    });
    mockedGetCurrentUserTopArtists.mockResolvedValue({
      items: [],
    });
    mockedGetCurrentUserRecentlyPlayed.mockResolvedValue({
      items: [],
    });
    mockedGetSpotifyRecommendations.mockResolvedValue({
      tracks: [],
    });
    mockedSearchSpotifyTracks.mockResolvedValue({
      tracks: {
        items: [],
      },
    });
  });

  it("uses artist search fallback when recommendations endpoint is unavailable", async () => {
    mockedGetCurrentUserTopTracks.mockResolvedValueOnce({
      items: [
        {
          id: "top-track-1",
          name: "Top Track",
          duration_ms: 1000,
          popularity: 50,
          album: {
            id: "album-1",
            name: "Album 1",
            images: [{ url: "https://example.com/album-1.jpg" }],
          },
          artists: [{ id: "artist-1", name: "Seed Artist" }],
        },
      ],
    });
    mockedGetSpotifyRecommendations.mockRejectedValue(
      new SpotifyApiError("Spotify request failed.", 404),
    );
    mockedSearchSpotifyTracks.mockResolvedValueOnce({
      tracks: {
        items: [
          {
            id: "search-track-1",
            name: "Search Track",
            duration_ms: 180000,
            popularity: 70,
            album: {
              id: "album-2",
              name: "Album 2",
              images: [{ url: "https://example.com/album-2.jpg" }],
            },
            artists: [{ id: "artist-1", name: "Seed Artist" }],
          },
        ],
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(body.source).toBe("spotify");
    expect(body.authState).toBe("connected");
    expect(body.data.tracks[0]?.title).toBe("Search Track");
    expect(mockedSearchSpotifyTracks).toHaveBeenCalledWith(
      "access-token",
      'artist:"Seed Artist"',
      {
        limit: 5,
      },
    );
  });

  it("falls back to user top tracks when search fallback returns no tracks", async () => {
    mockedGetCurrentUserTopTracks.mockResolvedValueOnce({
      items: [
        {
          id: "top-track-2",
          name: "My Top Song",
          duration_ms: 1000,
          popularity: 50,
          album: {
            id: "album-3",
            name: "Album 3",
            images: [{ url: "https://example.com/album-3.jpg" }],
          },
          artists: [{ id: "artist-2", name: "Fallback Artist" }],
        },
      ],
    });
    mockedGetSpotifyRecommendations.mockRejectedValue(
      new SpotifyApiError("Spotify request failed.", 404),
    );
    mockedSearchSpotifyTracks.mockResolvedValue({
      tracks: {
        items: [],
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(body.source).toBe("spotify");
    expect(body.authState).toBe("connected");
    expect(body.data.tracks[0]?.title).toBe("My Top Song");
    expect(body.data.tracks[0]?.reason).toContain("top tracks");
  });
});
