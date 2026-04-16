import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/spotify-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/spotify-api")>(
    "@/lib/spotify-api",
  );

  return {
    ...actual,
    refreshSpotifyAccessToken: vi.fn(),
  };
});

import { cookies } from "next/headers";
import { refreshSpotifyAccessToken } from "@/lib/spotify-api";
import { resolveSpotifyRouteSession } from "@/lib/spotify-route-auth";
import {
  sealSpotifySession,
  SPOTIFY_SESSION_COOKIE,
  type SpotifySession,
} from "@/lib/spotify-session";

const originalEnv = { ...process.env };
const mockedCookies = vi.mocked(cookies);
const mockedRefreshSpotifyAccessToken = vi.mocked(refreshSpotifyAccessToken);

function setSessionCookie(session: SpotifySession) {
  const sealedSession = sealSpotifySession(session);

  mockedCookies.mockResolvedValue({
    get(name: string) {
      if (name === SPOTIFY_SESSION_COOKIE) {
        return { value: sealedSession };
      }

      return undefined;
    },
  } as never);
}

describe("resolveSpotifyRouteSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SPOTIFY_SESSION_SECRET = "session-secret-value";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("requires reconnect when an existing session is missing requested scopes", async () => {
    setSessionCookie({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      scope: "user-read-email",
      expiresAt: Date.now() + 60_000,
      sessionExpiresAt: Date.now() + 86_400_000,
    });

    const resolution = await resolveSpotifyRouteSession({
      requiredScopes: ["playlist-modify-private"],
    });

    expect(resolution).toMatchObject({
      kind: "needs_reauth",
      reason: "missing_scope",
      clearSession: false,
    });
  });

  it("refreshes expired sessions and preserves previous scopes when refresh omits scope", async () => {
    setSessionCookie({
      accessToken: "old-access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      scope: "playlist-modify-private",
      expiresAt: Date.now() - 1,
      sessionExpiresAt: Date.now() + 86_400_000,
    });
    mockedRefreshSpotifyAccessToken.mockResolvedValueOnce({
      access_token: "new-access-token",
      expires_in: 3600,
      token_type: "Bearer",
    });

    const resolution = await resolveSpotifyRouteSession({
      requiredScopes: ["playlist-modify-private"],
    });

    expect(resolution.kind).toBe("ready");
    if (resolution.kind === "ready") {
      expect(resolution.session.accessToken).toBe("new-access-token");
      expect(resolution.session.scope).toBe("playlist-modify-private");
      expect(resolution.refreshedSession?.scope).toBe("playlist-modify-private");
    }
  });
});
