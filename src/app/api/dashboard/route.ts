import { NextResponse } from "next/server";
import { getMockDashboardData } from "@/lib/mock-dashboard";
import { isSpotifyConfigured } from "@/lib/spotify";

export function GET() {
  return NextResponse.json({
    data: getMockDashboardData(),
    spotifyConfigured: isSpotifyConfigured(),
  });
}
