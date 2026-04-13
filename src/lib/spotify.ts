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

export type SpotifyConfig = {
  clientId: string;
  appUrl: string;
  isConfigured: boolean;
  missing: string[];
  redirectUri: string;
  scopes: string[];
};

export class SpotifyConfigError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(`Missing Spotify configuration: ${missing.join(", ")}`);
    this.name = "SpotifyConfigError";
    this.missing = missing;
  }
}

export function getAppUrl() {
  return (process.env.APP_URL ?? DEFAULT_APP_URL).replace(/\/$/, "");
}

export function getSpotifyScopes() {
  return (process.env.SPOTIFY_SCOPES ?? DEFAULT_SCOPES.join(" "))
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function getSpotifyConfig(
  options: SpotifyConfigOptions = {},
): SpotifyConfig {
  const appUrl = getAppUrl();
  const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
  const sessionSecret = process.env.SPOTIFY_SESSION_SECRET ?? "";
  const missing = [
    ["SPOTIFY_CLIENT_ID", clientId],
    ["SPOTIFY_SESSION_SECRET", sessionSecret],
    ["APP_URL", appUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (options.strict && missing.length > 0) {
    throw new SpotifyConfigError(missing);
  }

  return {
    clientId,
    appUrl,
    isConfigured: missing.length === 0,
    missing,
    redirectUri: `${appUrl}/api/auth/callback/spotify`,
    scopes: getSpotifyScopes(),
  };
}

export function isSpotifyConfigured() {
  return getSpotifyConfig().isConfigured;
}

export function createRandomString(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function createCodeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function createSpotifyAuthorizeUrl(params: {
  state: string;
  codeChallenge: string;
}) {
  const config = getSpotifyConfig({ strict: true });
  const authorizeUrl = new URL(SPOTIFY_AUTHORIZE_URL);

  authorizeUrl.search = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state: params.state,
    code_challenge_method: "S256",
    code_challenge: params.codeChallenge,
  }).toString();

  return authorizeUrl;
}

export function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
