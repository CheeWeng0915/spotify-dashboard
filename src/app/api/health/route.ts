import { NextResponse } from "next/server";
import { getSpotifyConfig } from "@/lib/spotify";

export function GET() {
  const config = getSpotifyConfig();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    spotify: {
      configured: config.isConfigured,
      missing: config.missing,
    },
  });
}
