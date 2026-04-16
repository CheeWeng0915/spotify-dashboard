import type {
  OrganizerPlaylistItem,
  OrganizerStats,
} from "@/types/organizer-api";

const SPOTIFY_PLAYLIST_ITEM_URI_PATTERN = /^spotify:(track|episode):[A-Za-z0-9]+$/;

export type PlaylistOrganizerSourceItem = Omit<
  OrganizerPlaylistItem,
  "rowId" | "isDuplicate" | "duplicateGroup"
>;

export function isSpotifyPlaylistItemUri(value: unknown): value is string {
  return typeof value === "string" && SPOTIFY_PLAYLIST_ITEM_URI_PATTERN.test(value);
}

function createRowId(item: PlaylistOrganizerSourceItem) {
  return `${item.position}:${item.uri ?? "unavailable"}`;
}

export function createOrganizerRows(
  items: PlaylistOrganizerSourceItem[],
): OrganizerPlaylistItem[] {
  const uriCounts = new Map<string, number>();
  const firstUriPosition = new Map<string, number>();

  for (const item of items) {
    if (!item.uri) {
      continue;
    }

    uriCounts.set(item.uri, (uriCounts.get(item.uri) ?? 0) + 1);

    if (!firstUriPosition.has(item.uri)) {
      firstUriPosition.set(item.uri, item.position);
    }
  }

  return items.map((item) => {
    const isDuplicate =
      Boolean(item.uri) &&
      (uriCounts.get(item.uri ?? "") ?? 0) > 1 &&
      firstUriPosition.get(item.uri ?? "") !== item.position;

    return {
      ...item,
      rowId: createRowId(item),
      isDuplicate,
      duplicateGroup: isDuplicate ? item.uri : undefined,
    };
  });
}

export function calculateOrganizerStats(
  items: OrganizerPlaylistItem[],
): OrganizerStats {
  const uriCounts = new Map<string, number>();

  for (const item of items) {
    if (item.uri) {
      uriCounts.set(item.uri, (uriCounts.get(item.uri) ?? 0) + 1);
    }
  }

  let duplicateGroupCount = 0;
  let duplicateItemCount = 0;

  for (const count of uriCounts.values()) {
    if (count > 1) {
      duplicateGroupCount += 1;
      duplicateItemCount += count - 1;
    }
  }

  return {
    totalItems: items.length,
    totalDurationMs: items.reduce((sum, item) => sum + item.durationMs, 0),
    trackCount: items.filter((item) => item.type === "track").length,
    episodeCount: items.filter((item) => item.type === "episode").length,
    duplicateGroupCount,
    duplicateItemCount,
    unavailableItemCount: items.filter((item) => item.isUnavailable).length,
  };
}

export function getPlaylistUrisAfterRemoval(
  items: OrganizerPlaylistItem[],
  selectedRowIds: string[],
) {
  const selected = new Set(selectedRowIds);
  const remainingItems = items.filter((item) => !selected.has(item.rowId));
  const unselectedInvalidCount = remainingItems.filter((item) => !item.uri).length;

  return {
    removedCount: items.length - remainingItems.length,
    remainingUris: remainingItems
      .map((item) => item.uri)
      .filter(isSpotifyPlaylistItemUri),
    unselectedInvalidCount,
  };
}
