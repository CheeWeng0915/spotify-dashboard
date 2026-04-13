import { NextResponse } from "next/server";
import { getSpotifyConfig } from "@/lib/spotify";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    spotify: getSpotifyConfig(),
  });
}
