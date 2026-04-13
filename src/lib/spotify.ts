<<<<<<< Updated upstream
type SpotifyConfig = {
=======
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

const DEFAULT_APP_URL = "http://127.0.0.1:3000";
const DEFAULT_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
];

type SpotifyConfigOptions = {
  strict?: boolean;
};

export type SpotifyConfig = {
>>>>>>> Stashed changes
  clientId: string;
  hasClientSecret: boolean;
  appUrl: string;
  isConfigured: boolean;
  redirectUri: string;
};

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function isSpotifyConfigured() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
  );
}

export function getSpotifyConfig(): SpotifyConfig {
  return {
    clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
    hasClientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
    appUrl: getAppUrl(),
    isConfigured: isSpotifyConfigured(),
    redirectUri: `${getAppUrl()}/api/auth/callback/spotify`,
  };
}
