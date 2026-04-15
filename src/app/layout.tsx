import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LiquidNavbar } from "@/components/liquid-navbar";
import {
  isSpotifySessionHardExpired,
  SPOTIFY_SESSION_COOKIE,
  unsealSpotifySession,
} from "@/lib/spotify-session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify Reports",
  description: "Apple-style liquid glass Spotify listening reports.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  const cookieStorePromise = cookies();

  return (
    <html lang="en">
      <body>
        <LayoutContent cookieStorePromise={cookieStorePromise}>{children}</LayoutContent>
      </body>
    </html>
  );
}

type LayoutContentProps = {
  cookieStorePromise: ReturnType<typeof cookies>;
  children: React.ReactNode;
};

async function LayoutContent({ cookieStorePromise, children }: LayoutContentProps) {
  const cookieStore = await cookieStorePromise;
  const sessionCookie = cookieStore.get(SPOTIFY_SESSION_COOKIE)?.value;
  const session = sessionCookie ? unsealSpotifySession(sessionCookie) : null;
  const spotifyAuthenticated = Boolean(session && !isSpotifySessionHardExpired(session));

  return (
    <div className="app-shell">
      <LiquidNavbar spotifyAuthenticated={spotifyAuthenticated} />
      {children}
    </div>
  );
}
