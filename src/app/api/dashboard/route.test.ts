import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardData } from "@/types/dashboard";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/spotify", async () => {
  const actual = await vi.importActual<typeof import("@/lib/spotify")>("@/lib/spotify");

  return {
    ...actual,
    getSpotifyConfig: vi.fn(),
  };
});

vi.mock("@/lib/spotify-session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/spotify-session")>(
    "@/lib/spotify-session",
  );

  return {
    ...actual,
    unsealSpotifySession: vi.fn(),
    isSpotifySessionHardExpired: vi.fn(),
    isSpotifySessionExpired: vi.fn(),
    createSpotifySession: vi.fn(),
    sealSpotifySession: vi.fn(),
    getSpotifySessionCookieMaxAge: vi.fn(),
  };
});

vi.mock("@/lib/spotify-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/spotify-api")>(
    "@/lib/spotify-api",
  );

  return {
    ...actual,
    refreshSpotifyAccessToken: vi.fn(),
    getCurrentSpotifyProfile: vi.fn(),
    getCurrentUserTopTracks: vi.fn(),
    getCurrentUserTopArtists: vi.fn(),
    getCurrentUserRecentlyPlayed: vi.fn(),
  };
});

vi.mock("@/lib/spotify-dashboard", () => ({
  createDashboardDataFromSpotify: vi.fn(),
}));

import { cookies } from "next/headers";
import { GET } from "@/app/api/dashboard/route";
import {
  getCurrentSpotifyProfile,
  getCurrentUserRecentlyPlayed,
  getCurrentUserTopArtists,
  getCurrentUserTopTracks,
  refreshSpotifyAccessToken,
  SpotifyApiError,
} from "@/lib/spotify-api";
import { createDashboardDataFromSpotify } from "@/lib/spotify-dashboard";
import { getSpotifyConfig } from "@/lib/spotify";
import {
  createSpotifySession,
  getSpotifySessionCookieMaxAge,
  isSpotifySessionExpired,
  isSpotifySessionHardExpired,
  sealSpotifySession,
  SPOTIFY_SESSION_COOKIE,
  unsealSpotifySession,
} from "@/lib/spotify-session";

const mockedCookies = vi.mocked(cookies);
const mockedGetSpotifyConfig = vi.mocked(getSpotifyConfig);
const mockedUnsealSpotifySession = vi.mocked(unsealSpotifySession);
const mockedIsSpotifySessionHardExpired = vi.mocked(isSpotifySessionHardExpired);
const mockedIsSpotifySessionExpired = vi.mocked(isSpotifySessionExpired);
const mockedCreateSpotifySession = vi.mocked(createSpotifySession);
const mockedSealSpotifySession = vi.mocked(sealSpotifySession);
const mockedGetSpotifySessionCookieMaxAge = vi.mocked(getSpotifySessionCookieMaxAge);
const mockedRefreshSpotifyAccessToken = vi.mocked(refreshSpotifyAccessToken);
const mockedGetCurrentSpotifyProfile = vi.mocked(getCurrentSpotifyProfile);
const mockedGetCurrentUserTopTracks = vi.mocked(getCurrentUserTopTracks);
const mockedGetCurrentUserTopArtists = vi.mocked(getCurrentUserTopArtists);
const mockedGetCurrentUserRecentlyPlayed = vi.mocked(getCurrentUserRecentlyPlayed);
const mockedCreateDashboardDataFromSpotify = vi.mocked(createDashboardDataFromSpotify);

const mockDashboardData: DashboardData = {
  generatedAt: "2026-01-01T00:00:00.000Z",
  profileName: "Connected Listener",
  reports: [],
};

const baseSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  tokenType: "Bearer",
  scope: "user-read-private",
  expiresAt: Date.now() + 60_000,
  sessionExpiresAt: Date.now() + 86_400_000,
};

const refreshedSession = {
  ...baseSession,
  accessToken: "refreshed-access-token",
  expiresAt: Date.now() + 3_600_000,
};

function setSessionCookie(value?: string) {
  mockedCookies.mockResolvedValue({
    get(name: string) {
      if (name === SPOTIFY_SESSION_COOKIE && value) {
        return { value };
      }

      return undefined;
    },
  } as never);
}

describe("/api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedGetSpotifyConfig.mockReturnValue({
      appUrl: "https://spotify-dashboard-gules.vercel.app",
      clientId: "client-id",
      isConfigured: true,
      missing: [],
      redirectUri:
        "https://spotify-dashboard-gules.vercel.app/api/auth/callback/spotify",
      scopes: ["user-read-private"],
    });

    mockedUnsealSpotifySession.mockReturnValue(baseSession);
    mockedIsSpotifySessionHardExpired.mockReturnValue(false);
    mockedIsSpotifySessionExpired.mockReturnValue(false);
    mockedCreateSpotifySession.mockReturnValue(refreshedSession);
    mockedSealSpotifySession.mockReturnValue("sealed-refreshed-session");
    mockedGetSpotifySessionCookieMaxAge.mockReturnValue(3600);

    mockedRefreshSpotifyAccessToken.mockResolvedValue({
      access_token: "refreshed-access-token",
      expires_in: 3600,
      refresh_token: "refresh-token",
      scope: "user-read-private",
      token_type: "Bearer",
    });

    mockedGetCurrentSpotifyProfile.mockResolvedValue({
      display_name: "Connected Listener",
      id: "connected-listener",
      images: [],
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
    mockedCreateDashboardDataFromSpotify.mockReturnValue(mockDashboardData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns not_connected when session cookie is missing", async () => {
    setSessionCookie();

    const response = await GET();
    const body = await response.json();

    expect(body.authState).toBe("not_connected");
    expect(body.reason).toBe("missing_session");
    expect(body.spotifyAuthenticated).toBe(false);
    expect(body.source).toBe("mock");
  });

  it("clears corrupted session cookies when unsealing fails", async () => {
    setSessionCookie("corrupted-session");
    mockedUnsealSpotifySession.mockReturnValueOnce(null);

    const response = await GET();
    const body = await response.json();

    expect(body.authState).toBe("not_connected");
    expect(body.reason).toBe("missing_session");
    expect(response.headers.get("set-cookie")).toContain(`${SPOTIFY_SESSION_COOKIE}=;`);
  });

  it("forces reconnect when token is expired and refresh token is missing", async () => {
    setSessionCookie("sealed-session");
    mockedUnsealSpotifySession.mockReturnValueOnce({
      ...baseSession,
      refreshToken: undefined,
    });
    mockedIsSpotifySessionExpired.mockReturnValueOnce(true);

    const response = await GET();
    const body = await response.json();

    expect(body.authState).toBe("needs_reauth");
    expect(body.reason).toBe("missing_refresh_token");
    expect(body.spotifyAuthenticated).toBe(false);
    expect(response.headers.get("set-cookie")).toContain(`${SPOTIFY_SESSION_COOKIE}=;`);
  });

  it("forces reconnect when token refresh fails", async () => {
    setSessionCookie("sealed-session");
    mockedIsSpotifySessionExpired.mockReturnValueOnce(true);
    mockedRefreshSpotifyAccessToken.mockRejectedValueOnce(
      new SpotifyApiError("Invalid refresh token", 400),
    );

    const response = await GET();
    const body = await response.json();

    expect(body.authState).toBe("needs_reauth");
    expect(body.reason).toBe("token_refresh_failed");
    expect(body.error).toBe("spotify_reauth_required");
    expect(response.headers.get("set-cookie")).toContain(`${SPOTIFY_SESSION_COOKIE}=;`);
  });

  it("forces reconnect when Spotify returns unauthorized", async () => {
    setSessionCookie("sealed-session");
    mockedGetCurrentSpotifyProfile.mockRejectedValueOnce(
      new SpotifyApiError("Unauthorized", 401),
    );

    const response = await GET();
    const body = await response.json();

    expect(body.authState).toBe("needs_reauth");
    expect(body.reason).toBe("spotify_unauthorized");
    expect(body.error).toBe("spotify_unauthorized");
    expect(body.spotifyAuthenticated).toBe(false);
    expect(response.headers.get("set-cookie")).toContain(`${SPOTIFY_SESSION_COOKIE}=;`);
  });

  it("returns transient_error when Spotify is rate limited", async () => {
    setSessionCookie("sealed-session");
    mockedGetCurrentSpotifyProfile.mockRejectedValueOnce(
      new SpotifyApiError("Rate limited", 429),
    );

    const response = await GET();
    const body = await response.json();

    expect(body.authState).toBe("transient_error");
    expect(body.reason).toBe("spotify_rate_limited");
    expect(body.spotifyAuthenticated).toBe(true);
    expect(body.source).toBe("mock");
  });

  it("returns connected payload and refreshes cookie after successful token refresh", async () => {
    setSessionCookie("sealed-session");
    mockedIsSpotifySessionExpired.mockReturnValueOnce(true);

    const response = await GET();
    const body = await response.json();

    expect(body.authState).toBe("connected");
    expect(body.source).toBe("spotify");
    expect(body.spotifyAuthenticated).toBe(true);
    expect(body.data.profileName).toBe("Connected Listener");
    expect(mockedRefreshSpotifyAccessToken).toHaveBeenCalledWith("refresh-token");
    expect(response.headers.get("set-cookie")).toContain(
      `${SPOTIFY_SESSION_COOKIE}=sealed-refreshed-session`,
    );
  });
});
