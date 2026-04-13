import { NextResponse } from "next/server";
import { getSpotifyConfig } from "@/lib/spotify";

export function GET() {
  const config = getSpotifyConfig();

  if (!config.isConfigured) {
    return NextResponse.json(
      {
        error: "Missing Spotify configuration",
        message:
          "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to enable auth.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: "Spotify auth route scaffolded.",
    nextStep:
      "Replace this response with your authorize redirect once credentials are ready.",
    redirectUri: config.redirectUri,
  });
}
