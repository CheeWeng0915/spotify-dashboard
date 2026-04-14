import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/auth/spotify/route";
import {
  SPOTIFY_AUTH_STATE_COOKIE,
  SPOTIFY_CODE_VERIFIER_COOKIE,
} from "@/lib/spotify-session";

const originalEnv = { ...process.env };

function setConfiguredEnv() {
  process.env.APP_URL = "http://127.0.0.1:3000";
  process.env.SPOTIFY_CLIENT_ID = "client-id";
  process.env.SPOTIFY_SESSION_SECRET = "session-secret-value";
}

describe("/api/auth/spotify", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 400 when Spotify config is missing", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_SESSION_SECRET;

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.missing).toContain("SPOTIFY_CLIENT_ID");
    expect(body.missing).toContain("SPOTIFY_SESSION_SECRET");
  });

  it("redirects to Spotify and stores temporary OAuth cookies", () => {
    setConfiguredEnv();

    const response = GET();
    const location = response.headers.get("location");
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(307);
    expect(location).toContain("https://accounts.spotify.com/authorize");
    expect(location).toContain("code_challenge_method=S256");
    expect(setCookie).toContain(SPOTIFY_AUTH_STATE_COOKIE);
    expect(setCookie).toContain(SPOTIFY_CODE_VERIFIER_COOKIE);
  });

  it("uses forwarded host/proto for callback redirect_uri", () => {
    setConfiguredEnv();

    const request = new Request(
      "http://localhost:3000/api/auth/spotify?next=%2Freports%2Fdaily",
      {
        headers: {
          "x-forwarded-host": "my-app.example.dev",
          "x-forwarded-proto": "https",
        },
      },
    );
    const response = GET(request);
    const location = response.headers.get("location");

    expect(location).toContain(
      encodeURIComponent("https://my-app.example.dev/api/auth/callback/spotify"),
    );
  });
});
