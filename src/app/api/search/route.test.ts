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
    searchSpotifyCatalog: vi.fn(),
  };
});

import { GET } from "@/app/api/search/route";
import { getSpotifyConfig } from "@/lib/spotify";
import { searchSpotifyCatalog } from "@/lib/spotify-api";
import {
  applySpotifySessionResponseCookies,
  classifySpotifyRequestError,
  resolveSpotifyRouteSession,
} from "@/lib/spotify-route-auth";

const mockedGetSpotifyConfig = vi.mocked(getSpotifyConfig);
const mockedSearchSpotifyCatalog = vi.mocked(searchSpotifyCatalog);
const mockedResolveSpotifyRouteSession = vi.mocked(resolveSpotifyRouteSession);
const mockedApplySpotifySessionResponseCookies = vi.mocked(applySpotifySessionResponseCookies);
const mockedClassifySpotifyRequestError = vi.mocked(classifySpotifyRequestError);

describe("/api/search", () => {
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
        scope: "user-read-private",
        expiresAt: Date.now() + 60_000,
        sessionExpiresAt: Date.now() + 86_400_000,
      },
    });
    mockedSearchSpotifyCatalog.mockResolvedValue({
      tracks: {
        items: [],
      },
    });
  });

  it("returns empty results for empty queries without calling Spotify search", async () => {
    const response = await GET(new Request("http://localhost/api/search?q="));
    const body = await response.json();

    expect(body.authState).toBe("connected");
    expect(body.results).toEqual([]);
    expect(mockedSearchSpotifyCatalog).not.toHaveBeenCalled();
  });

  it("maps podcast searches to show and episode result types", async () => {
    mockedSearchSpotifyCatalog.mockResolvedValueOnce({
      shows: {
        items: [
          {
            id: "show-1",
            name: "Design Show",
            publisher: "Studio",
            images: [{ url: "https://example.com/show.jpg" }],
            external_urls: {
              spotify: "https://open.spotify.com/show/show-1",
            },
            total_episodes: 42,
          },
        ],
      },
      episodes: {
        items: [
          {
            id: "episode-1",
            name: "Pilot",
            duration_ms: 120000,
            external_urls: {
              spotify: "https://open.spotify.com/episode/episode-1",
            },
            show: {
              name: "Design Show",
            },
          },
        ],
      },
    });

    const response = await GET(
      new Request("http://localhost/api/search?q=design&category=podcasts"),
    );
    const body = await response.json();

    expect(mockedSearchSpotifyCatalog).toHaveBeenCalledWith(
      "access-token",
      "design",
      ["show", "episode"],
      {
        limit: 10,
      },
    );
    expect(body.results).toMatchObject([
      {
        type: "show",
        title: "Design Show",
      },
      {
        type: "episode",
        title: "Pilot",
        durationMs: 120000,
      },
    ]);
  });

  it("returns not connected when search is requested without a session", async () => {
    mockedResolveSpotifyRouteSession.mockResolvedValueOnce({
      kind: "not_connected",
      reason: "missing_session",
      clearSession: false,
    });

    const response = await GET(new Request("http://localhost/api/search?q=song"));
    const body = await response.json();

    expect(body.authState).toBe("not_connected");
    expect(body.spotifyAuthenticated).toBe(false);
  });
});
