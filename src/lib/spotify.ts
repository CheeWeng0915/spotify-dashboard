type SpotifyConfig = {
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
