import { NextResponse } from "next/server";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  return NextResponse.json({
    message: "Spotify callback route scaffolded.",
    code,
    error,
    nextStep: "Exchange the code for tokens here and persist the session.",
  });
}
