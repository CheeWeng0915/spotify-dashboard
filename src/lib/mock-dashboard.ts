import type { DashboardData } from "@/types/dashboard";

export function getMockDashboardData(): DashboardData {
  return {
    generatedAt: new Date("2026-01-01T12:00:00.000Z").toISOString(),
    profileName: "Spotify 听歌样例",
    reports: [
      {
        period: "daily",
        heading: "今日报告",
        subheading: "过去 24 小时的收听统计",
        metrics: [
          {
            label: "收听时长",
            value: "2h 14m",
            delta: "24 小时滚动窗口",
            description: "按播放记录中每首歌时长累积计算。",
          },
          {
            label: "播放次数",
            value: "38 次",
            delta: "24 首不同歌曲",
            description: "16 张不同专辑",
          },
          {
            label: "最多播放歌曲",
            value: "Nights",
            delta: "6 次",
            description: "Frank Ocean · Blonde",
          },
        ],
        topTracks: [
          {
            title: "Nights",
            artist: "Frank Ocean",
            album: "Blonde",
            plays: "6 次",
            duration: "32m",
          },
          {
            title: "K.",
            artist: "Cigarettes After Sex",
            album: "Cigarettes After Sex",
            plays: "4 次",
            duration: "21m",
          },
          {
            title: "Pink + White",
            artist: "Frank Ocean",
            album: "Blonde",
            plays: "3 次",
            duration: "9m",
          },
        ],
        topAlbums: [
          {
            title: "Blonde",
            artist: "Frank Ocean",
            plays: "9 次",
            duration: "48m",
          },
          {
            title: "Cigarettes After Sex",
            artist: "Cigarettes After Sex",
            plays: "7 次",
            duration: "31m",
          },
        ],
      },
      {
        period: "weekly",
        heading: "周报",
        subheading: "过去 7 天你最常听的歌曲与专辑",
        metrics: [
          {
            label: "收听时长",
            value: "11h 26m",
            delta: "7 天滚动窗口",
            description: "按播放记录中每首歌时长累积计算。",
          },
          {
            label: "播放次数",
            value: "212 次",
            delta: "88 首不同歌曲",
            description: "54 张不同专辑",
          },
          {
            label: "最多播放歌曲",
            value: "Snowfall",
            delta: "14 次",
            description: "Øneheart, reidenshi · snowfall",
          },
        ],
        topTracks: [
          {
            title: "Snowfall",
            artist: "Øneheart, reidenshi",
            album: "snowfall",
            plays: "14 次",
            duration: "40m",
          },
          {
            title: "Sparks",
            artist: "Coldplay",
            album: "Parachutes",
            plays: "11 次",
            duration: "42m",
          },
        ],
        topAlbums: [
          {
            title: "Parachutes",
            artist: "Coldplay",
            plays: "19 次",
            duration: "1h 11m",
          },
          {
            title: "SOS",
            artist: "SZA",
            plays: "16 次",
            duration: "58m",
          },
        ],
      },
      {
        period: "monthly",
        heading: "月报",
        subheading: "过去 30 天听歌趋势与月度总结",
        metrics: [
          {
            label: "收听时长",
            value: "46h 08m",
            delta: "30 天滚动窗口",
            description: "按播放记录中每首歌时长累积计算。",
          },
          {
            label: "播放次数",
            value: "856 次",
            delta: "264 首不同歌曲",
            description: "138 张不同专辑",
          },
          {
            label: "最多播放歌曲",
            value: "505",
            delta: "34 次",
            description: "Arctic Monkeys · AM",
          },
        ],
        topTracks: [
          {
            title: "505",
            artist: "Arctic Monkeys",
            album: "AM",
            plays: "34 次",
            duration: "2h 17m",
          },
          {
            title: "Saturn",
            artist: "SZA",
            album: "Saturn",
            plays: "28 次",
            duration: "1h 54m",
          },
        ],
        topAlbums: [
          {
            title: "AM",
            artist: "Arctic Monkeys",
            plays: "77 次",
            duration: "4h 48m",
          },
          {
            title: "SOS",
            artist: "SZA",
            plays: "61 次",
            duration: "4h 01m",
          },
        ],
      },
      {
        period: "yearly",
        heading: "年报（Wrapped 风格）",
        subheading: "过去 365 天的年度收听总结",
        metrics: [
          {
            label: "收听时长",
            value: "582h",
            delta: "365 天滚动窗口",
            description: "按播放记录中每首歌时长累积计算。",
          },
          {
            label: "播放次数",
            value: "10,420 次",
            delta: "1,146 首不同歌曲",
            description: "612 张不同专辑",
          },
          {
            label: "年度主打歌曲",
            value: "Cigarette Daydreams",
            delta: "95 次",
            description: "Cage The Elephant · Melophobia",
          },
        ],
        topTracks: [
          {
            title: "Cigarette Daydreams",
            artist: "Cage The Elephant",
            album: "Melophobia",
            plays: "95 次",
            duration: "6h 12m",
          },
          {
            title: "Nights",
            artist: "Frank Ocean",
            album: "Blonde",
            plays: "89 次",
            duration: "7h 56m",
          },
        ],
        topAlbums: [
          {
            title: "Blonde",
            artist: "Frank Ocean",
            plays: "242 次",
            duration: "18h 44m",
          },
          {
            title: "Melophobia",
            artist: "Cage The Elephant",
            plays: "218 次",
            duration: "13h 19m",
          },
        ],
      },
    ],
  };
}
