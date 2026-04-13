"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { TopAlbumList } from "@/components/top-album-list";
import { TopTrackList } from "@/components/top-track-list";
import type { DashboardData } from "@/types/dashboard";

type DashboardShellProps = {
  data: DashboardData;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
};

export function DashboardShell({
  data,
  spotifyConfigured,
  spotifyAuthenticated,
}: DashboardShellProps) {
  const [state, setState] = useState({
    data,
    spotifyConfigured,
    spotifyAuthenticated,
    source: "mock" as "mock" | "spotify",
    fetchError: false,
  });

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard data.");
        }

        const payload = (await response.json()) as {
          data: DashboardData;
          spotifyConfigured: boolean;
          spotifyAuthenticated: boolean;
          source: "mock" | "spotify";
        };

        if (!active) {
          return;
        }

        setState({
          data: payload.data,
          spotifyConfigured: payload.spotifyConfigured,
          spotifyAuthenticated: payload.spotifyAuthenticated,
          source: payload.source,
          fetchError: false,
        });
      } catch {
        if (!active) {
          return;
        }

        setState((previous) => ({
          ...previous,
          fetchError: true,
        }));
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  const statusText = state.spotifyAuthenticated
    ? "Spotify 账号已连接"
    : state.spotifyConfigured
      ? "Spotify 应用已配置"
      : "请先配置 Spotify 环境变量以启用实时数据";
  const generatedAtLabel = useMemo(() => {
    const timestamp = Date.parse(state.data.generatedAt);
    if (Number.isNaN(timestamp)) {
      return "未知时间";
    }
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(new Date(timestamp));
  }, [state.data.generatedAt]);
  const sourceLabel = state.source === "spotify" ? "Spotify 实时数据" : "样例数据";

  return (
    <section className="dashboard">
      <div className="dashboard__hero">
        <div>
          <span className="dashboard__eyebrow">Spotify 收听仪表盘</span>
          <h1 className="dashboard__title">你的日/周/月/年听歌报告</h1>
          <p className="dashboard__copy">
            今日最常听歌曲、今日时长、周报、月报、年报都会从 Spotify
            播放数据自动聚合，支持歌曲和专辑的多维度统计。
          </p>
          <a className="dashboard__api" href="/api/dashboard">
            Open `/api/dashboard`
          </a>
        </div>

        <aside className="dashboard__panel dashboard__status">
          <span className="dashboard__status-label">后端状态</span>
          <strong className="dashboard__status-value">Next.js API 正常</strong>
          <span
            className={`dashboard__status-chip${
              state.spotifyConfigured ? "" : " dashboard__status-chip--off"
            }`}
          >
            {statusText}
          </span>
          <div className="dashboard__actions">
            <a className="dashboard__button" href="/api/auth/spotify">
              连接 Spotify
            </a>
            {state.spotifyAuthenticated ? (
              <a
                className="dashboard__button dashboard__button--secondary"
                href="/api/auth/logout"
              >
                断开连接
              </a>
            ) : null}
          </div>
          <span className="dashboard__status-label">
            数据源：{sourceLabel} · 更新时间：{generatedAtLabel}
          </span>
          {state.spotifyAuthenticated && state.source === "spotify" ? (
            <span className="dashboard__status-label">
              当前账号：{state.data.profileName}
            </span>
          ) : null}
          {state.fetchError ? (
            <span className="dashboard__status-label">
              暂时无法刷新最新数据，正在显示上一次可用结果。
            </span>
          ) : null}
        </aside>
      </div>

      {state.data.reports.map((report) => (
        <div key={report.period} className="dashboard__section">
          <div className="dashboard__section-head">
            <h2 className="dashboard__section-title">{report.heading}</h2>
            <p className="dashboard__section-copy">{report.subheading}</p>
          </div>
          <div className="dashboard__grid">
            {report.metrics.map((metric) => (
              <MetricCard key={`${report.period}-${metric.label}`} metric={metric} />
            ))}
          </div>
          <div className="dashboard__report-grid">
            <div className="dashboard__list-card">
              <h3 className="dashboard__list-title">歌曲排行</h3>
              <TopTrackList tracks={report.topTracks} />
            </div>
            <div className="dashboard__list-card">
              <h3 className="dashboard__list-title">专辑排行</h3>
              <TopAlbumList albums={report.topAlbums} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
