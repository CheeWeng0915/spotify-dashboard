import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSpotifySession,
  getSpotifySessionCookieMaxAge,
  isSpotifySessionHardExpired,
  isSpotifySessionExpired,
  sealSpotifySession,
  unsealSpotifySession,
} from "@/lib/spotify-session";

const originalEnv = { ...process.env };

describe("spotify session", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SPOTIFY_SESSION_SECRET = "session-secret-value";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("seals and unseals an encrypted session cookie payload", () => {
    const session = createSpotifySession({
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "Bearer",
      scope: "user-read-email",
      expires_in: 3600,
    });
    const sealed = sealSpotifySession(session);

    expect(sealed).not.toContain("access-token");
    expect(unsealSpotifySession(sealed)).toEqual(session);
  });

  it("rejects tampered session cookies", () => {
    const sealed = sealSpotifySession(
      createSpotifySession({
        access_token: "access-token",
        token_type: "Bearer",
        expires_in: 3600,
      }),
    );

    expect(unsealSpotifySession(`${sealed}tampered`)).toBeNull();
  });

  it("detects expired sessions", () => {
    const now = Date.now();

    expect(
      isSpotifySessionExpired({
        accessToken: "access-token",
        tokenType: "Bearer",
        scope: "",
        expiresAt: now - 1,
        sessionExpiresAt: now + 1000,
      }),
    ).toBe(true);
  });

  it("expires hard session at fixed deadline", () => {
    const now = Date.now();

    expect(
      isSpotifySessionHardExpired({
        accessToken: "access-token",
        tokenType: "Bearer",
        scope: "",
        expiresAt: now + 1000,
        sessionExpiresAt: now - 1,
      }),
    ).toBe(true);
  });

  it("computes cookie max-age from remaining hard session time", () => {
    const now = Date.now();

    expect(
      getSpotifySessionCookieMaxAge(
        {
          accessToken: "access-token",
          tokenType: "Bearer",
          scope: "",
          expiresAt: now + 60_000,
          sessionExpiresAt: now + 4_500,
        },
        now,
      ),
    ).toBe(4);
  });
});
