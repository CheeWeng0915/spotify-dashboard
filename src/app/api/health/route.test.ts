import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

const originalEnv = { ...process.env };

describe("/api/health", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.APP_URL = "http://127.0.0.1:3000";
    process.env.SPOTIFY_CLIENT_ID = "client-id";
    process.env.SPOTIFY_SESSION_SECRET = "session-secret-value";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns a minimal Spotify health shape without exposing client config", async () => {
    const response = GET();
    const body = await response.json();

    expect(body.status).toBe("ok");
    expect(body.spotify.configured).toBe(true);
    expect(body.spotify.clientId).toBeUndefined();
    expect(body.spotify.redirectUri).toBeUndefined();
  });
});
