import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export const SPOTIFY_AUTH_STATE_COOKIE = "spotify_auth_state";
export const SPOTIFY_CODE_VERIFIER_COOKIE = "spotify_code_verifier";
export const SPOTIFY_POST_AUTH_REDIRECT_COOKIE = "spotify_post_auth_redirect";
export const SPOTIFY_SESSION_COOKIE = "spotify_session";
export const SPOTIFY_TEMP_COOKIE_MAX_AGE = 10 * 60;
export const SPOTIFY_SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const SESSION_VERSION = "v1";

export type SpotifySession = {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope: string;
  expiresAt: number;
};

type SpotifyTokenLike = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope?: string;
  expires_in: number;
};

function getSessionKey() {
  const secret = process.env.SPOTIFY_SESSION_SECRET;

  if (!secret) {
    throw new Error("SPOTIFY_SESSION_SECRET is required to store Spotify sessions.");
  }

  return createHash("sha256").update(secret).digest();
}

export function createSpotifySession(
  token: SpotifyTokenLike,
  previousRefreshToken?: string,
): SpotifySession {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? previousRefreshToken,
    tokenType: token.token_type,
    scope: token.scope ?? "",
    expiresAt: Date.now() + Math.max(token.expires_in - 60, 0) * 1000,
  };
}

export function isSpotifySessionExpired(session: SpotifySession) {
  return session.expiresAt <= Date.now();
}

export function sealSpotifySession(session: SpotifySession) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    SESSION_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function unsealSpotifySession(value: string): SpotifySession | null {
  try {
    const [version, iv, tag, encrypted] = value.split(".");

    if (version !== SESSION_VERSION || !iv || !tag || !encrypted) {
      return null;
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getSessionKey(),
      Buffer.from(iv, "base64url"),
    );

    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8")) as SpotifySession;
  } catch {
    return null;
  }
}
