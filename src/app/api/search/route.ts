import { NextResponse } from "next/server";
import {
  searchSpotifyCatalog,
  type SpotifySearchCatalogResponse,
  type SpotifySearchType,
} from "@/lib/spotify-api";
import { getSpotifyConfig } from "@/lib/spotify";
import {
  applySpotifySessionResponseCookies,
  classifySpotifyRequestError,
  resolveSpotifyRouteSession,
} from "@/lib/spotify-route-auth";
import type { SpotifySession } from "@/lib/spotify-session";
import type {
  SearchCategory,
  SearchPayload,
  SearchResultItem,
} from "@/types/search-api";

const SEARCH_TYPE_BY_CATEGORY: Record<SearchCategory, SpotifySearchType[]> = {
  all: ["track", "artist", "album", "show", "episode"],
  tracks: ["track"],
  artists: ["artist"],
  albums: ["album"],
  podcasts: ["show", "episode"],
};

function pickImageUrl(images: Array<{ url: string }> | undefined) {
  return images?.[0]?.url;
}

function getSearchCategory(value: string | null): SearchCategory {
  if (
    value === "tracks" ||
    value === "artists" ||
    value === "albums" ||
    value === "podcasts"
  ) {
    return value;
  }

  return "all";
}

function createPayload(payload: Omit<SearchPayload, "spotifyConfigured">): SearchPayload {
  return {
    spotifyConfigured: getSpotifyConfig().isConfigured,
    ...payload,
  };
}

function createJsonResponse(
  payload: Omit<SearchPayload, "spotifyConfigured">,
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

function mapSearchResults(response: SpotifySearchCatalogResponse): SearchResultItem[] {
  return [
    ...(response.tracks?.items ?? []).map((track) => ({
      id: track.id,
      type: "track" as const,
      title: track.name,
      subtitle: track.artists.map((artist) => artist.name).join(", "),
      detail: track.album.name,
      durationMs: track.duration_ms,
      imageUrl: pickImageUrl(track.album.images),
      spotifyUrl: track.external_urls?.spotify,
    })),
    ...(response.artists?.items ?? []).map((artist) => ({
      id: artist.id,
      type: "artist" as const,
      title: artist.name,
      subtitle: "Artist",
      imageUrl: pickImageUrl(artist.images),
      spotifyUrl: artist.external_urls?.spotify,
    })),
    ...(response.albums?.items ?? []).map((album) => ({
      id: album.id,
      type: "album" as const,
      title: album.name,
      subtitle: album.artists.map((artist) => artist.name).join(", "),
      detail: album.release_date ? `Album - ${album.release_date}` : "Album",
      imageUrl: pickImageUrl(album.images),
      spotifyUrl: album.external_urls?.spotify,
    })),
    ...(response.shows?.items ?? []).map((show) => ({
      id: show.id,
      type: "show" as const,
      title: show.name,
      subtitle: show.publisher ?? "Podcast",
      detail:
        typeof show.total_episodes === "number"
          ? `${show.total_episodes} episodes`
          : "Podcast show",
      imageUrl: pickImageUrl(show.images),
      spotifyUrl: show.external_urls?.spotify,
    })),
    ...(response.episodes?.items ?? []).map((episode) => ({
      id: episode.id,
      type: "episode" as const,
      title: episode.name,
      subtitle: episode.show?.name ?? episode.show?.publisher ?? "Podcast episode",
      detail: "Podcast episode",
      durationMs: episode.duration_ms,
      imageUrl: pickImageUrl(episode.images),
      spotifyUrl: episode.external_urls?.spotify,
    })),
  ];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const category = getSearchCategory(url.searchParams.get("category"));
  const sessionResolution = await resolveSpotifyRouteSession();

  if (sessionResolution.kind === "not_connected") {
    return createJsonResponse(
      {
        query,
        category,
        results: [],
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
        query,
        category,
        results: [],
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

  if (!query) {
    return createJsonResponse(
      {
        query,
        category,
        results: [],
        spotifyAuthenticated: true,
        authState: "connected",
      },
      {
        refreshedSession: sessionResolution.refreshedSession,
      },
    );
  }

  try {
    const response = await searchSpotifyCatalog(
      sessionResolution.session.accessToken,
      query,
      SEARCH_TYPE_BY_CATEGORY[category],
      {
        limit: 10,
      },
    );

    return createJsonResponse(
      {
        query,
        category,
        results: mapSearchResults(response),
        spotifyAuthenticated: true,
        authState: "connected",
      },
      {
        refreshedSession: sessionResolution.refreshedSession,
      },
    );
  } catch (error) {
    console.error("spotify_search_failed", error);
    const classifiedError = classifySpotifyRequestError(error);

    return createJsonResponse(
      {
        query,
        category,
        results: [],
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
