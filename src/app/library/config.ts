import type { LibraryCategory, ListeningPeriod } from "@/types/dashboard";

export const libraryPageConfig = {
  periods: ["daily", "weekly", "monthly", "yearly"] as ListeningPeriod[],
  categories: ["artists", "albums"] as LibraryCategory[],
};
