import { NextResponse } from "next/server";
import {
  getCurrentSpotifyProfile,
  getCurrentUserRecentlyPlayed,
  getCurrentUserTopArtists,
  getCurrentUserTopTracks,
  getSpotifyRecommendations,
  searchSpotifyTracks,
  SpotifyApiError,
} from "@/lib/spotify-api";
import { getMockDiscoveryData } from "@/lib/mock-discovery";
import {
  applySpotifySessionResponseCookies,
  classifySpotifyRequestError,
  resolveSpotifyRouteSession,
} from "@/lib/spotify-route-auth";
import { getSpotifyConfig } from "@/lib/spotify";
import type {
  SpotifyRecentlyPlayedResponse,
  SpotifyRecommendationsResponse,
  SpotifySearchTracksResponse,
  SpotifyTopArtistsResponse,
  SpotifyTopTracksResponse,
} from "@/lib/spotify-api";
import type { SpotifySession } from "@/lib/spotify-session";
import type { DiscoveryPayload } from "@/types/discovery-api";

const SEED_TRACK_LIMIT = 3;
const SEED_ARTIST_LIMIT = 2;
const RECOMMENDATION_LIMIT = 20;

const EMPTY_TOP_TRACKS: SpotifyTopTracksResponse = {
  items: [],
};

const EMPTY_TOP_ARTISTS: SpotifyTopArtistsResponse = {
  items: [],
};

const EMPTY_RECENTLY_PLAYED: SpotifyRecentlyPlayedResponse = {
  items: [],
};

const EMPTY_RECOMMENDATIONS: SpotifyRecommendationsResponse = {
  tracks: [],
};
const EMPTY_SEARCH_TRACKS: SpotifySearchTracksResponse = {
  tracks: {
    items: [],
  },
};

function pickImageUrl(images: Array<{ url: string }> | undefined): string | undefined {
  return images?.[0]?.url;
}

async function withSpotifyFallback<T>(label: string, request: Promise<T>, fallback: T) {
  try {
    return await request;
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      const isExpectedRecommendations404 =
        error.status === 404 && label.startsWith("discovery_recommendations");

      if (!isExpectedRecommendations404) {
        console.warn(
          `spotify_optional_fetch_failed:${label} status=${error.status} message=${error.message}`,
        );
      }

      return fallback;
    }

    console.error(`spotify_optional_fetch_failed:${label}`, error);
    return fallback;
  }
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function buildArtistSearchSeeds(options: {
  topArtists: SpotifyTopArtistsResponse;
  topTracks: SpotifyTopTracksResponse;
  recentlyPlayed: SpotifyRecentlyPlayedResponse;
}) {
  return uniqueStrings([
    ...options.topArtists.items.map((artist) => artist.name),
    ...options.topTracks.items.flatMap((track) => track.artists.map((artist) => artist.name)),
    ...options.recentlyPlayed.items.flatMap((item) =>
      item.track.artists.map((artist) => artist.name),
    ),
  ]).slice(0, 5);
}

function createArtistSearchQuery(artistName: string) {
  const sanitizedName = artistName.replace(/"/g, "").trim();

  if (!sanitizedName) {
    return "";
  }

  return `artist:"${sanitizedName}"`;
}

function createPayload(
  payload: Omit<DiscoveryPayload, "spotifyConfigured">,
): DiscoveryPayload {
  return {
    spotifyConfigured: getSpotifyConfig().isConfigured,
    ...payload,
  };
}

function createMockPayload(
  payload: Omit<DiscoveryPayload, "data" | "source" | "spotifyAuthenticated" | "spotifyConfigured"> & {
    spotifyAuthenticated?: boolean;
    data?: DiscoveryPayload["data"];
  },
): Omit<DiscoveryPayload, "spotifyConfigured"> {
  return {
    data: payload.data ?? getMockDiscoveryData(),
    source: "mock",
    spotifyAuthenticated: payload.spotifyAuthenticated ?? false,
    authState: payload.authState,
    reason: payload.reason,
    error: payload.error,
  };
}

function createJsonResponse(
  payload: Omit<DiscoveryPayload, "spotifyConfigured">,
  options: {
    clearSession?: boolean;
    refreshedSession?: SpotifySession;
  } = {},
) {
  const response = NextResponse.json(createPayload(payload));
  applySpotifySessionResponseCookies(response, options);
  return response;
}

function createFallbackDiscoveryData(options: {
  generatedAt: string;
  profileName: string;
  topTracks: SpotifyTopTracksResponse;
  topArtists: SpotifyTopArtistsResponse;
  recentlyPlayed: SpotifyRecentlyPlayedResponse;
}) {
  const fallbackTracksFromTopTracks = options.topTracks.items.slice(0, 10).map((track) => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    album: track.album.name,
    imageUrl: pickImageUrl(track.album.images),
    reason: "From your top tracks while fresh recommendations load",
  }));
  const fallbackArtistsFromTopArtists = options.topArtists.items.slice(0, 10).map((artist) => ({
    id: artist.id,
    name: artist.name,
    imageUrl: pickImageUrl(artist.images),
    reason: "From your top artists while fresh recommendations load",
  }));
  const recentTrackMap = new Map<
    string,
    { id: string; title: string; artist: string; album: string; imageUrl?: string }
  >();
  const recentArtistMap = new Map<string, { id: string; name: string }>();

  for (const item of options.recentlyPlayed.items) {
    if (!recentTrackMap.has(item.track.id)) {
      recentTrackMap.set(item.track.id, {
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists.map((artist) => artist.name).join(", "),
        album: item.track.album.name,
        imageUrl: pickImageUrl(item.track.album.images),
      });
    }

    for (const artist of item.track.artists) {
      recentArtistMap.set(artist.id ?? artist.name, {
        id: artist.id ?? artist.name,
        name: artist.name,
      });
    }
  }

  const fallbackTracks =
    fallbackTracksFromTopTracks.length > 0
      ? fallbackTracksFromTopTracks
      : Array.from(recentTrackMap.values())
          .slice(0, 10)
          .map((track) => ({
            ...track,
            reason: "From your recent listens while fresh recommendations load",
          }));
  const fallbackArtists =
    fallbackArtistsFromTopArtists.length > 0
      ? fallbackArtistsFromTopArtists
      : Array.from(recentArtistMap.values())
          .slice(0, 10)
          .map((artist) => ({
            ...artist,
            reason: "From your recent listens while fresh recommendations load",
          }));

  return {
    generatedAt: options.generatedAt,
    profileName: options.profileName,
    tracks: fallbackTracks,
    artists: fallbackArtists,
  };
}

export async function GET() {
  const sessionResolution = await resolveSpotifyRouteSession();

  if (sessionResolution.kind === "not_connected") {
    return createJsonResponse(
      createMockPayload({
        authState: "not_connected",
        reason: sessionResolution.reason,
      }),
      {
        clearSession: sessionResolution.clearSession,
      },
    );
  }

  if (sessionResolution.kind === "needs_reauth") {
    return createJsonResponse(
      createMockPayload({
        authState: "needs_reauth",
        reason: sessionResolution.reason,
        error: sessionResolution.error,
      }),
      {
        clearSession: true,
      },
    );
  }

  try {
    const [profile, topTracks, topArtists, recentlyPlayed] = await Promise.all([
      getCurrentSpotifyProfile(sessionResolution.session.accessToken),
      withSpotifyFallback(
        "discovery_top_tracks_short_term",
        getCurrentUserTopTracks(sessionResolution.session.accessToken, "short_term", 20),
        EMPTY_TOP_TRACKS,
      ),
      withSpotifyFallback(
        "discovery_top_artists_short_term",
        getCurrentUserTopArtists(sessionResolution.session.accessToken, "short_term", 20),
        EMPTY_TOP_ARTISTS,
      ),
      withSpotifyFallback(
        "discovery_recently_played",
        getCurrentUserRecentlyPlayed(sessionResolution.session.accessToken, {
          limit: 20,
        }),
        EMPTY_RECENTLY_PLAYED,
      ),
    ]);

    const seedTracks = uniqueStrings([
      ...topTracks.items.map((track) => track.id),
      ...recentlyPlayed.items.map((item) => item.track.id),
    ]).slice(0, SEED_TRACK_LIMIT);
    const seedArtists = uniqueStrings(topArtists.items.map((artist) => artist.id)).slice(
      0,
      SEED_ARTIST_LIMIT,
    );
    const hasUserSeeds = seedTracks.length > 0 || seedArtists.length > 0;

    const seededRecommendations = hasUserSeeds
      ? await withSpotifyFallback(
          "discovery_recommendations_seeded",
          getSpotifyRecommendations(sessionResolution.session.accessToken, {
            seedTracks,
            seedArtists,
            limit: RECOMMENDATION_LIMIT,
          }),
          EMPTY_RECOMMENDATIONS,
        )
      : EMPTY_RECOMMENDATIONS;
    const recommendationsWithFallback =
      seededRecommendations.tracks.length > 0
        ? seededRecommendations
        : await withSpotifyFallback(
            "discovery_recommendations_genre_fallback",
            getSpotifyRecommendations(sessionResolution.session.accessToken, {
              seedGenres: ["pop", "rock", "hip-hop"],
              limit: RECOMMENDATION_LIMIT,
            }),
            EMPTY_RECOMMENDATIONS,
          );

    const recommendedTracks = recommendationsWithFallback.tracks.slice(0, 10).map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      imageUrl: pickImageUrl(track.album.images),
      reason: "Recommended based on your listening profile",
    }));
    const recommendedArtists = Array.from(
      new Map(
        recommendationsWithFallback.tracks.flatMap((track) =>
          track.artists.map((artist) => [
            artist.id ?? artist.name,
            {
              id: artist.id ?? artist.name,
              name: artist.name,
              reason: "Appears in your recommended tracks",
            },
          ]),
        ),
      ).values(),
    ).slice(0, 10);
    const artistSearchSeeds = buildArtistSearchSeeds({
      topArtists,
      topTracks,
      recentlyPlayed,
    });
    const artistSearchTrackRows =
      recommendedTracks.length > 0
        ? []
        : (
            await Promise.all(
              artistSearchSeeds.map((artistName) =>
                withSpotifyFallback(
                  `discovery_artist_search_tracks:${artistName}`,
                  searchSpotifyTracks(
                    sessionResolution.session.accessToken,
                    createArtistSearchQuery(artistName),
                    {
                      limit: 5,
                    },
                  ),
                  EMPTY_SEARCH_TRACKS,
                ).then((response) => ({
                  artistName,
                  response,
                })),
              ),
            )
          ).flatMap(({ artistName, response }) =>
            response.tracks.items.map((track) => ({
              id: track.id,
              title: track.name,
              artist: track.artists.map((row) => row.name).join(", "),
              album: track.album.name,
              imageUrl: pickImageUrl(track.album.images),
              reason: `Popular track by ${artistName}`,
            })),
          );
    const globalSearchTrackRows =
      recommendedTracks.length > 0 || artistSearchTrackRows.length > 0
        ? []
        : (
            await Promise.all(
              [`year:${new Date().getUTCFullYear()}`, "top hits"].map((queryText) =>
                withSpotifyFallback(
                  `discovery_global_search_tracks:${queryText}`,
                  searchSpotifyTracks(sessionResolution.session.accessToken, queryText, {
                    limit: 10,
                  }),
                  EMPTY_SEARCH_TRACKS,
                ),
              ),
            )
          ).flatMap((response) =>
            response.tracks.items.map((track) => ({
              id: track.id,
              title: track.name,
              artist: track.artists.map((artist) => artist.name).join(", "),
              album: track.album.name,
              imageUrl: pickImageUrl(track.album.images),
              reason: "Trending on Spotify right now",
            })),
          );
    const searchFallbackTrackRows = [...artistSearchTrackRows, ...globalSearchTrackRows];
    const recommendedTracksFromSearch = Array.from(
      new Map(searchFallbackTrackRows.map((track) => [track.id, track])).values(),
    ).slice(0, 10);
    const recommendedArtistsFromSearch = Array.from(
      new Map(
        searchFallbackTrackRows.flatMap((track) =>
          track.artist.split(", ").map((artistName) => [
            artistName,
            {
              id: artistName,
              name: artistName,
              reason: "Appears in top tracks from your favorite artists",
            },
          ]),
        ),
      ).values(),
    ).slice(0, 10);
    const finalRecommendedTracks =
      recommendedTracks.length > 0 ? recommendedTracks : recommendedTracksFromSearch;
    const finalRecommendedArtists =
      recommendedArtists.length > 0 ? recommendedArtists : recommendedArtistsFromSearch;
    const generatedAt = new Date().toISOString();
    const profileName = profile.display_name ?? profile.id;
    const fallbackData = createFallbackDiscoveryData({
      generatedAt,
      profileName,
      topTracks,
      topArtists,
      recentlyPlayed,
    });
    const mockData = {
      ...getMockDiscoveryData(),
      generatedAt,
      profileName,
    };
    const shouldUseRecommendations =
      finalRecommendedTracks.length > 0 || finalRecommendedArtists.length > 0;
    const shouldUseSpotifyFallback =
      fallbackData.tracks.length > 0 || fallbackData.artists.length > 0;
    const data =
      shouldUseRecommendations
        ? {
            generatedAt,
            profileName,
            tracks: finalRecommendedTracks,
            artists: finalRecommendedArtists,
          }
        : shouldUseSpotifyFallback
          ? fallbackData
          : mockData;
    const usingMockFallback = !shouldUseRecommendations && !shouldUseSpotifyFallback;

    return createJsonResponse(
      {
        data,
        source: usingMockFallback ? "mock" : "spotify",
        spotifyAuthenticated: true,
        authState: usingMockFallback ? "transient_error" : "connected",
        reason: usingMockFallback ? "spotify_upstream_error" : undefined,
        error: usingMockFallback ? "spotify_empty_recommendations" : undefined,
      },
      {
        refreshedSession: sessionResolution.refreshedSession,
      },
    );
  } catch (error) {
    console.error("spotify_discovery_fetch_failed", error);
    const classifiedError = classifySpotifyRequestError(error);

    return createJsonResponse(
      createMockPayload({
        authState: classifiedError.authState,
        reason: classifiedError.reason,
        spotifyAuthenticated: classifiedError.authState === "transient_error",
        error: classifiedError.error,
      }),
      {
        clearSession: classifiedError.clearSession,
        refreshedSession:
          classifiedError.clearSession || classifiedError.authState === "needs_reauth"
            ? undefined
            : sessionResolution.refreshedSession,
      },
    );
  }
}
