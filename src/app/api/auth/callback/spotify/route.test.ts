import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/auth/callback/spotify/route";

const originalEnv = { ...process.env };

describe("/api/auth/callback/spotify", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.APP_URL = "http://127.0.0.1:3000";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("redirects without leaking the authorization code when state is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/callback/spotify?code=secret-code&state=state",
    );
    const response = await GET(request);
    const location = response.headers.get("location") ?? "";
    const body = await response.text();

    expect(response.status).toBe(307);
    expect(location).toContain("spotify=error");
    expect(location).toContain("reason=missing_oauth_state");
    expect(location).not.toContain("secret-code");
    expect(body).not.toContain("secret-code");
  });

  it("redirects using forwarded host/proto on callback errors", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/callback/spotify?error=access_denied",
      {
        headers: {
          "x-forwarded-host": "my-app.example.dev",
          "x-forwarded-proto": "https",
        },
      },
    );
    const response = await GET(request);
    const location = response.headers.get("location") ?? "";

    expect(location).toContain("https://my-app.example.dev/");
    expect(location).toContain("spotify=error");
    expect(location).toContain("reason=spotify_denied");
  });
});
