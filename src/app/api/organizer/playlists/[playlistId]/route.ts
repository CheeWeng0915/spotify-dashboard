import { NextResponse } from "next/server";
import {
  getCurrentSpotifyProfile,
  getSpotifyPlaylist,
  getSpotifyPlaylistItems,
  replaceSpotifyPlaylistItems,
  type SpotifyPlaylistDetailsResponse,
  type SpotifyPlaylistItemObject,
} from "@/lib/spotify-api";
import {
  calculateOrganizerStats,
  createOrganizerRows,
  getPlaylistUrisAfterRemoval,
  isSpotifyPlaylistItemUri,
  type PlaylistOrganizerSourceItem,
} from "@/lib/playlist-organizer";
import { getSpotifyConfig } from "@/lib/spotify";
import {
  applySpotifySessionResponseCookies,
  classifySpotifyRequestError,
  resolveSpotifyRouteSession,
} from "@/lib/spotify-route-auth";
import type { SpotifySession } from "@/lib/spotify-session";
import type {
  OrganizerMutationPayload,
  OrganizerPlaylistDetailPayload,
  OrganizerPlaylistItem,
  OrganizerPlaylistSummary,
} from "@/types/organizer-api";

const ORGANIZER_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-private",
  "playlist-modify-public",
];
const PLAYLIST_ITEM_PAGE_LIMIT = 50;
const MAX_PLAYLIST_ITEM_PAGES = 20;

type PlaylistDetailContext = {
  params: Promise<{
    playlistId: string;
  }>;
};

type OrganizerResponsePayload =
  | Omit<OrganizerPlaylistDetailPayload, "spotifyConfigured">
  | Omit<OrganizerMutationPayload, "spotifyConfigured">;

function pickImageUrl(images: Array<{ url: string }> | undefined) {
  return images?.[0]?.url;
}

function createPayload<T extends OrganizerResponsePayload>(
  payload: T,
): T & { spotifyConfigured: boolean } {
  return {
    spotifyConfigured: getSpotifyConfig().isConfigured,
    ...payload,
  };
}

function createJsonResponse<T extends OrganizerResponsePayload>(
  payload: T,
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

function createEmptyStats() {
  return calculateOrganizerStats([]);
}

function createPlaylistSummary(
  playlist: SpotifyPlaylistDetailsResponse,
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

function isEditablePlaylist(
  playlist: SpotifyPlaylistDetailsResponse,
  currentUserId: string,
) {
  return playlist.owner?.id === currentUserId || Boolean(playlist.collaborative);
}

function getItemType(item: SpotifyPlaylistItemObject | null) {
  if (item?.type === "track" || item?.type === "episode") {
    return item.type;
  }

  return "unknown";
}

function getItemImageUrl(item: SpotifyPlaylistItemObject | null) {
  if (!item) {
    return undefined;
  }

  return pickImageUrl(item.album?.images ?? item.images ?? item.show?.images);
}

function getItemSubtitle(item: SpotifyPlaylistItemObject | null) {
  if (!item) {
    return "Unavailable";
  }

  if (item.type === "track") {
    return item.artists?.map((artist) => artist.name).join(", ") || "Unknown artist";
  }

  if (item.type === "episode") {
    return item.show?.name ?? item.show?.publisher ?? "Podcast episode";
  }

  return "Unknown item";
}

function getItemAlbumOrShow(item: SpotifyPlaylistItemObject | null) {
  if (!item) {
    return "Unavailable";
  }

  return item.album?.name ?? item.show?.name ?? item.show?.publisher ?? "Spotify";
}

function toSourceItems(
  items: Array<{ track: SpotifyPlaylistItemObject | null }>,
): PlaylistOrganizerSourceItem[] {
  return items.map((item, position) => {
    const track = item.track;
    const uri = isSpotifyPlaylistItemUri(track?.uri) ? track.uri : undefined;
    const isUnavailable = !track || !uri || Boolean(track.is_local);

    return {
      position,
      type: getItemType(track),
      title: track?.name?.trim() || "Unavailable item",
      subtitle: getItemSubtitle(track),
      albumOrShow: getItemAlbumOrShow(track),
      durationMs:
        typeof track?.duration_ms === "number" && Number.isFinite(track.duration_ms)
          ? track.duration_ms
          : 0,
      uri,
      imageUrl: getItemImageUrl(track),
      spotifyUrl: track?.external_urls?.spotify,
      isUnavailable,
    };
  });
}

async function getAllPlaylistItems(accessToken: string, playlistId: string) {
  const items: Array<{ track: SpotifyPlaylistItemObject | null }> = [];

  for (let page = 0; page < MAX_PLAYLIST_ITEM_PAGES; page += 1) {
    const response = await getSpotifyPlaylistItems(accessToken, playlistId, {
      limit: PLAYLIST_ITEM_PAGE_LIMIT,
      offset: page * PLAYLIST_ITEM_PAGE_LIMIT,
    });

    items.push(...response.items);

    if (!response.next || response.items.length < PLAYLIST_ITEM_PAGE_LIMIT) {
      break;
    }
  }

  return items;
}

async function resolveReadySession() {
  const sessionResolution = await resolveSpotifyRouteSession({
    requiredScopes: ORGANIZER_SCOPES,
  });

  if (sessionResolution.kind === "not_connected") {
    return {
      sessionResolution: null,
      response: createJsonResponse(
        {
          spotifyAuthenticated: false,
          authState: "not_connected",
          reason: sessionResolution.reason,
          items: [],
          stats: createEmptyStats(),
        },
        {
          clearSession: sessionResolution.clearSession,
        },
      ),
    };
  }

  if (sessionResolution.kind === "needs_reauth") {
    return {
      sessionResolution: null,
      response: createJsonResponse(
        {
          spotifyAuthenticated: false,
          authState: "needs_reauth",
          reason: sessionResolution.reason,
          error: sessionResolution.error,
          items: [],
          stats: createEmptyStats(),
        },
        {
          clearSession: sessionResolution.clearSession,
        },
      ),
    };
  }

  return {
    sessionResolution,
    response: null,
  };
}

function createDetailPayload(options: {
  playlist: SpotifyPlaylistDetailsResponse;
  rows: OrganizerPlaylistItem[];
}): Omit<OrganizerPlaylistDetailPayload, "spotifyConfigured"> {
  return {
    spotifyAuthenticated: true,
    authState: "connected",
    playlist: createPlaylistSummary(options.playlist),
    items: options.rows,
    stats: calculateOrganizerStats(options.rows),
  };
}

export async function GET(_request: Request, context: PlaylistDetailContext) {
  const { sessionResolution, response } = await resolveReadySession();

  if (response) {
    return response;
  }

  const { playlistId } = await context.params;

  try {
    const [profile, playlist, playlistItems] = await Promise.all([
      getCurrentSpotifyProfile(sessionResolution.session.accessToken),
      getSpotifyPlaylist(sessionResolution.session.accessToken, playlistId),
      getAllPlaylistItems(sessionResolution.session.accessToken, playlistId),
    ]);

    if (!isEditablePlaylist(playlist, profile.id)) {
      return createJsonResponse(
        {
          spotifyAuthenticated: true,
          authState: "connected",
          error: "playlist_not_editable",
          items: [],
          stats: createEmptyStats(),
        },
        {
          refreshedSession: sessionResolution.refreshedSession,
          status: 403,
        },
      );
    }

    const rows = createOrganizerRows(toSourceItems(playlistItems));

    return createJsonResponse(createDetailPayload({ playlist, rows }), {
      refreshedSession: sessionResolution.refreshedSession,
    });
  } catch (error) {
    console.error("spotify_organizer_playlist_failed", error);
    const classifiedError = classifySpotifyRequestError(error);

    return createJsonResponse(
      {
        spotifyAuthenticated: classifiedError.authState === "transient_error",
        authState: classifiedError.authState,
        reason: classifiedError.reason,
        error: classifiedError.error,
        items: [],
        stats: createEmptyStats(),
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

export async function PATCH(request: Request, context: PlaylistDetailContext) {
  const { sessionResolution, response } = await resolveReadySession();

  if (response) {
    return response;
  }

  const { playlistId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        confirm?: unknown;
        selectedRowIds?: unknown;
        snapshotId?: unknown;
      }
    | null;
  const selectedRowIds = Array.isArray(body?.selectedRowIds)
    ? body.selectedRowIds.filter((rowId): rowId is string => typeof rowId === "string")
    : [];
  const snapshotId = typeof body?.snapshotId === "string" ? body.snapshotId : "";

  if (body?.confirm !== true || selectedRowIds.length === 0 || !snapshotId) {
    return createJsonResponse(
      {
        spotifyAuthenticated: true,
        authState: "connected",
        error: "invalid_cleanup_request",
      },
      {
        refreshedSession: sessionResolution.refreshedSession,
        status: 400,
      },
    );
  }

  try {
    const [profile, playlist, playlistItems] = await Promise.all([
      getCurrentSpotifyProfile(sessionResolution.session.accessToken),
      getSpotifyPlaylist(sessionResolution.session.accessToken, playlistId),
      getAllPlaylistItems(sessionResolution.session.accessToken, playlistId),
    ]);

    if (!isEditablePlaylist(playlist, profile.id)) {
      return createJsonResponse(
        {
          spotifyAuthenticated: true,
          authState: "connected",
          error: "playlist_not_editable",
        },
        {
          refreshedSession: sessionResolution.refreshedSession,
          status: 403,
        },
      );
    }

    if (playlist.snapshot_id && playlist.snapshot_id !== snapshotId) {
      return createJsonResponse(
        {
          spotifyAuthenticated: true,
          authState: "connected",
          error: "playlist_changed",
        },
        {
          refreshedSession: sessionResolution.refreshedSession,
          status: 409,
        },
      );
    }

    const rows = createOrganizerRows(toSourceItems(playlistItems));
    const { remainingUris, removedCount, unselectedInvalidCount } =
      getPlaylistUrisAfterRemoval(rows, selectedRowIds);

    if (removedCount === 0) {
      return createJsonResponse(
        {
          spotifyAuthenticated: true,
          authState: "connected",
          error: "no_items_selected",
        },
        {
          refreshedSession: sessionResolution.refreshedSession,
          status: 400,
        },
      );
    }

    if (unselectedInvalidCount > 0) {
      return createJsonResponse(
        {
          spotifyAuthenticated: true,
          authState: "connected",
          error: "cannot_preserve_invalid_items",
        },
        {
          refreshedSession: sessionResolution.refreshedSession,
          status: 400,
        },
      );
    }

    const mutation = await replaceSpotifyPlaylistItems(
      sessionResolution.session.accessToken,
      playlistId,
      remainingUris,
    );

    return createJsonResponse(
      {
        spotifyAuthenticated: true,
        authState: "connected",
        snapshotId: mutation.snapshot_id,
        removedCount,
      },
      {
        refreshedSession: sessionResolution.refreshedSession,
      },
    );
  } catch (error) {
    console.error("spotify_organizer_cleanup_failed", error);
    const classifiedError = classifySpotifyRequestError(error);

    return createJsonResponse(
      {
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
