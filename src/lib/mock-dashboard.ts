import type { DashboardData } from "@/types/dashboard";

export function getMockDashboardData(): DashboardData {
  return {
    generatedAt: new Date("2026-01-01T12:00:00.000Z").toISOString(),
    profileName: "Spotify Sample Listener",
    reports: [
      {
        period: "daily",
        heading: "Daily Report",
        subheading: "Listening stats for the last 24 hours",
        metrics: [
          {
            label: "Listening Time",
            value: "2h 14m",
            delta: "24-hour rolling window",
            description: "Calculated by summing track durations from play history.",
          },
          {
            label: "Play Count",
            value: "38 plays",
            delta: "24 unique tracks",
            description: "16 unique albums",
          },
          {
            label: "Most Played Song",
            value: "Nights",
            delta: "6 plays",
            description: "Frank Ocean · Blonde",
          },
        ],
        topTracks: [
          {
            title: "Nights",
            artist: "Frank Ocean",
            album: "Blonde",
            plays: "6 plays",
            duration: "32m",
          },
          {
            title: "K.",
            artist: "Cigarettes After Sex",
            album: "Cigarettes After Sex",
            plays: "4 plays",
            duration: "21m",
          },
          {
            title: "Pink + White",
            artist: "Frank Ocean",
            album: "Blonde",
            plays: "3 plays",
            duration: "9m",
          },
        ],
        topArtists: [
          {
            name: "Frank Ocean",
            plays: "9 plays",
            duration: "48m",
            topTrack: "Nights",
          },
          {
            name: "Cigarettes After Sex",
            plays: "7 plays",
            duration: "31m",
            topTrack: "K.",
          },
        ],
        topAlbums: [
          {
            title: "Blonde",
            artist: "Frank Ocean",
            plays: "9 plays",
            duration: "48m",
          },
          {
            title: "Cigarettes After Sex",
            artist: "Cigarettes After Sex",
            plays: "7 plays",
            duration: "31m",
          },
        ],
      },
      {
        period: "weekly",
        heading: "Weekly Report",
        subheading: "Your most played tracks and albums over the last 7 days",
        metrics: [
          {
            label: "Listening Time",
            value: "11h 26m",
            delta: "7-day rolling window",
            description: "Calculated by summing track durations from play history.",
          },
          {
            label: "Play Count",
            value: "212 plays",
            delta: "88 unique tracks",
            description: "54 unique albums",
          },
          {
            label: "Most Played Song",
            value: "Snowfall",
            delta: "14 plays",
            description: "Øneheart, reidenshi · snowfall",
          },
        ],
        topTracks: [
          {
            title: "Snowfall",
            artist: "Øneheart, reidenshi",
            album: "snowfall",
            plays: "14 plays",
            duration: "40m",
          },
          {
            title: "Sparks",
            artist: "Coldplay",
            album: "Parachutes",
            plays: "11 plays",
            duration: "42m",
          },
        ],
        topArtists: [
          {
            name: "Øneheart, reidenshi",
            plays: "14 plays",
            duration: "40m",
            topTrack: "Snowfall",
          },
          {
            name: "Coldplay",
            plays: "11 plays",
            duration: "42m",
            topTrack: "Sparks",
          },
        ],
        topAlbums: [
          {
            title: "Parachutes",
            artist: "Coldplay",
            plays: "19 plays",
            duration: "1h 11m",
          },
          {
            title: "SOS",
            artist: "SZA",
            plays: "16 plays",
            duration: "58m",
          },
        ],
      },
      {
        period: "monthly",
        heading: "Monthly Report",
        subheading: "30-day listening trends and summary",
        metrics: [
          {
            label: "Listening Time",
            value: "46h 08m",
            delta: "30-day rolling window",
            description: "Calculated by summing track durations from play history.",
          },
          {
            label: "Play Count",
            value: "856 plays",
            delta: "264 unique tracks",
            description: "138 unique albums",
          },
          {
            label: "Most Played Song",
            value: "505",
            delta: "34 plays",
            description: "Arctic Monkeys · AM",
          },
        ],
        topTracks: [
          {
            title: "505",
            artist: "Arctic Monkeys",
            album: "AM",
            plays: "34 plays",
            duration: "2h 17m",
          },
          {
            title: "Saturn",
            artist: "SZA",
            album: "Saturn",
            plays: "28 plays",
            duration: "1h 54m",
          },
        ],
        topArtists: [
          {
            name: "Arctic Monkeys",
            plays: "34 plays",
            duration: "2h 17m",
            topTrack: "505",
          },
          {
            name: "SZA",
            plays: "28 plays",
            duration: "1h 54m",
            topTrack: "Saturn",
          },
        ],
        topAlbums: [
          {
            title: "AM",
            artist: "Arctic Monkeys",
            plays: "77 plays",
            duration: "4h 48m",
          },
          {
            title: "SOS",
            artist: "SZA",
            plays: "61 plays",
            duration: "4h 01m",
          },
        ],
      },
      {
        period: "yearly",
        heading: "Yearly Report (Wrapped Style)",
        subheading: "Your annual listening summary for the last 365 days",
        metrics: [
          {
            label: "Listening Time",
            value: "582h",
            delta: "365-day rolling window",
            description: "Calculated by summing track durations from play history.",
          },
          {
            label: "Play Count",
            value: "10,420 plays",
            delta: "1,146 unique tracks",
            description: "612 unique albums",
          },
          {
            label: "Song of the Year",
            value: "Cigarette Daydreams",
            delta: "95 plays",
            description: "Cage The Elephant · Melophobia",
          },
        ],
        topTracks: [
          {
            title: "Cigarette Daydreams",
            artist: "Cage The Elephant",
            album: "Melophobia",
            plays: "95 plays",
            duration: "6h 12m",
          },
          {
            title: "Nights",
            artist: "Frank Ocean",
            album: "Blonde",
            plays: "89 plays",
            duration: "7h 56m",
          },
        ],
        topArtists: [
          {
            name: "Cage The Elephant",
            plays: "95 plays",
            duration: "6h 12m",
            topTrack: "Cigarette Daydreams",
          },
          {
            name: "Frank Ocean",
            plays: "89 plays",
            duration: "7h 56m",
            topTrack: "Nights",
          },
        ],
        topAlbums: [
          {
            title: "Blonde",
            artist: "Frank Ocean",
            plays: "242 plays",
            duration: "18h 44m",
          },
          {
            title: "Melophobia",
            artist: "Cage The Elephant",
            plays: "218 plays",
            duration: "13h 19m",
          },
        ],
      },
    ],
  };
}
