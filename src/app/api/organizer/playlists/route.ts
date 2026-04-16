import { NextResponse } from "next/server";
import {
  getCurrentSpotifyProfile,
  getCurrentUserPlaylists,
  type SpotifyPlaylistSummaryItem,
} from "@/lib/spotify-api";
import { getSpotifyConfig } from "@/lib/spotify";
import {
  applySpotifySessionResponseCookies,
  classifySpotifyRequestError,
  resolveSpotifyRouteSession,
} from "@/lib/spotify-route-auth";
import type { SpotifySession } from "@/lib/spotify-session";
import type {
  OrganizerPlaylistListPayload,
  OrganizerPlaylistSummary,
} from "@/types/organizer-api";

const ORGANIZER_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-private",
  "playlist-modify-public",
];
const PLAYLIST_PAGE_LIMIT = 50;
const MAX_PLAYLIST_PAGES = 20;

function pickImageUrl(images: Array<{ url: string }> | undefined) {
  return images?.[0]?.url;
}

function createPayload(
  payload: Omit<OrganizerPlaylistListPayload, "spotifyConfigured">,
): OrganizerPlaylistListPayload {
  return {
    spotifyConfigured: getSpotifyConfig().isConfigured,
    ...payload,
  };
}

function createJsonResponse(
  payload: Omit<OrganizerPlaylistListPayload, "spotifyConfigured">,
  options: {
    clearSession?: boolean;
    refreshedSession?: SpotifySession;
    status?: number;
  } = {},
) {
  const response = NextResponse.json(createPayload(payload), {
    status: options.status,
  });
  applySpotifySessionResponseCookies(response, options);
  return response;
}

function toPlaylistSummary(
  playlist: SpotifyPlaylistSummaryItem,
): OrganizerPlaylistSummary {
  return {
    id: playlist.id,
    name: playlist.name,
    ownerName: playlist.owner?.display_name ?? playlist.owner?.id ?? "Unknown owner",
    totalItems: playlist.tracks?.total ?? 0,
    imageUrl: pickImageUrl(playlist.images),
    spotifyUrl: playlist.external_urls?.spotify,
    snapshotId: playlist.snapshot_id,
  };
}

async function getEditablePlaylists(accessToken: string, currentUserId: string) {
  const playlists: SpotifyPlaylistSummaryItem[] = [];

  for (let page = 0; page < MAX_PLAYLIST_PAGES; page += 1) {
    const response = await getCurrentUserPlaylists(accessToken, {
      limit: PLAYLIST_PAGE_LIMIT,
      offset: page * PLAYLIST_PAGE_LIMIT,
    });

    playlists.push(...response.items);

    if (!response.next || response.items.length < PLAYLIST_PAGE_LIMIT) {
      break;
    }
  }

  return playlists.filter(
    (playlist) => playlist.owner?.id === currentUserId || playlist.collaborative,
  );
}

export async function GET() {
  const sessionResolution = await resolveSpotifyRouteSession({
    requiredScopes: ORGANIZER_SCOPES,
  });

  if (sessionResolution.kind === "not_connected") {
    return createJsonResponse(
      {
        playlists: [],
        spotifyAuthenticated: false,
        authState: "not_connected",
        reason: sessionResolution.reason,
      },
      {
        clearSession: sessionResolution.clearSession,
      },
    );
  }

  if (sessionResolution.kind === "needs_reauth") {
    return createJsonResponse(
      {
        playlists: [],
        spotifyAuthenticated: false,
        authState: "needs_reauth",
        reason: sessionResolution.reason,
        error: sessionResolution.error,
      },
      {
        clearSession: sessionResolution.clearSession,
      },
    );
  }

  try {
    const profile = await getCurrentSpotifyProfile(sessionResolution.session.accessToken);
    const playlists = await getEditablePlaylists(
      sessionResolution.session.accessToken,
      profile.id,
    );

    return createJsonResponse(
      {
        playlists: playlists.map(toPlaylistSummary),
        spotifyAuthenticated: true,
        authState: "connected",
      },
      {
        refreshedSession: sessionResolution.refreshedSession,
      },
    );
  } catch (error) {
    console.error("spotify_organizer_playlists_failed", error);
    const classifiedError = classifySpotifyRequestError(error);

    return createJsonResponse(
      {
        playlists: [],
        spotifyAuthenticated: classifiedError.authState === "transient_error",
        authState: classifiedError.authState,
        reason: classifiedError.reason,
        error: classifiedError.error,
      },
      {
        clearSession: classifiedError.clearSession,
        refreshedSession: classifiedError.clearSession
          ? undefined
          : sessionResolution.refreshedSession,
      },
    );
  }
}
