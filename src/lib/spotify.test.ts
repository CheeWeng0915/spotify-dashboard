import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  SpotifyConfigError,
  createCodeChallenge,
  createSpotifyAuthorizeUrl,
  getSpotifyConfig,
  timingSafeStringEqual,
} from "@/lib/spotify";

const originalEnv = { ...process.env };

function setConfiguredEnv() {
  process.env.APP_URL = "http://example.test/";
  process.env.SPOTIFY_CLIENT_ID = "client-id";
  process.env.SPOTIFY_SESSION_SECRET = "session-secret-value";
  process.env.SPOTIFY_SCOPES = "user-read-email user-top-read";
}

describe("spotify config", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    setConfiguredEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("builds a normalized redirect URI and configured status", () => {
    const config = getSpotifyConfig();

    expect(config.isConfigured).toBe(true);
    expect(config.appUrl).toBe("http://example.test");
    expect(config.redirectUri).toBe(
      "http://example.test/api/auth/callback/spotify",
    );
    expect(config.scopes).toEqual(["user-read-email", "user-top-read"]);
  });

  it("throws in strict mode when required Spotify config is missing", () => {
    delete process.env.SPOTIFY_CLIENT_ID;

    expect(() =>
      createSpotifyAuthorizeUrl({
        state: "state",
        codeChallenge: "challenge",
      }),
    ).toThrow(SpotifyConfigError);
  });

  it("creates a PKCE S256 code challenge", () => {
    expect(createCodeChallenge("plain-verifier")).toHaveLength(43);
  });

  it("builds a Spotify authorize URL with state and PKCE params", () => {
    const url = createSpotifyAuthorizeUrl({
      state: "state-value",
      codeChallenge: "challenge-value",
    });

    expect(url.origin).toBe("https://accounts.spotify.com");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-value");
  });

  it("compares OAuth state values safely", () => {
    expect(timingSafeStringEqual("same", "same")).toBe(true);
    expect(timingSafeStringEqual("same", "nope")).toBe(false);
  });
});
