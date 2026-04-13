import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSpotifySession,
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
    expect(
      isSpotifySessionExpired({
        accessToken: "access-token",
        tokenType: "Bearer",
        scope: "",
        expiresAt: Date.now() - 1,
      }),
    ).toBe(true);
  });
});
