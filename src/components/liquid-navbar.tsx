"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNavItems } from "@/components/liquid-navbar/config";
import { useDashboardProfileState } from "@/components/use-dashboard-state";

function NavIcon({ label }: { label: string }) {
  if (label === "Search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M10.5 4a6.5 6.5 0 0 1 5.16 10.46l4.44 4.44-1.4 1.4-4.44-4.44A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
      </svg>
    );
  }

  if (label === "Library") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M5 5h2v14H5V5Zm5 0h2v14h-2V5Zm5 0h2v14h-2V5Zm4 0h2v14h-2V5Z" />
      </svg>
    );
  }

  if (label === "Organizer") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M4 6h10v2H4V6Zm0 5h10v2H4v-2Zm0 5h7v2H4v-2Zm12-8.5c0-.48.34-.9.82-.98l3-.5A1 1 0 0 1 21 6v8.5a2.5 2.5 0 1 1-2-2.45V7.18l-1 .17v8.15a2.5 2.5 0 1 1-2-2.45V7.5Z" />
      </svg>
    );
  }

  if (label === "Player") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.97-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z" />
      </svg>
    );
  }

  if (label === "Reports") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M9 18.5A3.5 3.5 0 1 1 7 15.34V5.5c0-.48.34-.9.81-.98l10-1.8A1 1 0 0 1 19 3.7v11.8a3.5 3.5 0 1 1-2-3.16V7.3l-8 1.44v9.76Z" />
      </svg>
    );
  }

  if (label === "Discover") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.01 8.01 0 0 1-8 8Zm0-13a1 1 0 0 0-.98.8l-1.6 8a1 1 0 0 0 1.44 1.08l5-2.5a1 1 0 0 0 .54-.64l1.6-8A1 1 0 0 0 16.56 4.66l-5 2.5A1 1 0 0 0 12 7Z" />
      </svg>
    );
  }

  if (label === "Connect") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M8.5 12a3.5 3.5 0 0 1 3.5-3.5h3v2h-3a1.5 1.5 0 0 0 0 3h3v2h-3A3.5 3.5 0 0 1 8.5 12Zm4.5 1h-2v-2h2v2Zm-4 2.5H6a3.5 3.5 0 1 1 0-7h3v2H6a1.5 1.5 0 0 0 0 3h3v2Zm6-7h3a3.5 3.5 0 1 1 0 7h-3v-2h3a1.5 1.5 0 0 0 0-3h-3v-2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
      <path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z" />
    </svg>
  );
}

type LiquidNavbarProps = {
  spotifyAuthenticated: boolean;
};

const THEME_STORAGE_KEY = "spotify-dashboard-theme";

type ThemeMode = "light" | "dark";

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "dark";
}

export function LiquidNavbar({ spotifyAuthenticated }: LiquidNavbarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(spotifyAuthenticated);
  const profileState = useDashboardProfileState();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const themeToggleRef = useRef<HTMLInputElement | null>(null);

  const profileName = profileState.profileName || "Spotify User";
  const profileInitial = profileName.charAt(0).toUpperCase();
  const isProfilePage = pathname.startsWith("/profile");

  useEffect(() => {
    const initialThemeMode = getInitialThemeMode();
    document.documentElement.dataset.theme = initialThemeMode;

    if (themeToggleRef.current) {
      themeToggleRef.current.checked = initialThemeMode === "dark";
    }
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (avatarMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsProfileMenuOpen(false);
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isProfileMenuOpen]);

  function applyThemeMode(nextThemeMode: ThemeMode) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextThemeMode);
    document.documentElement.dataset.theme = nextThemeMode;
  }

  return (
    <aside className={`site-nav-wrap${spotifyAuthenticated ? " site-nav-wrap--authenticated" : ""}`}>
      <nav className="site-nav" aria-label="Primary">
        <div className="site-nav__brand">
          <div className="site-nav__brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36a.63.63 0 01-.86.21c-2.37-1.45-5.35-1.78-8.86-.97a.63.63 0 01-.28-1.22c3.84-.88 7.14-.5 9.8 1.12a.63.63 0 01.2.86zm1.23-2.73a.79.79 0 01-1.08.26c-2.71-1.67-6.84-2.15-10.04-1.18a.79.79 0 01-.46-1.51c3.66-1.11 8.21-.57 11.33 1.35a.79.79 0 01.25 1.08zm.11-2.84c-3.25-1.93-8.6-2.11-11.69-1.17a.95.95 0 01-.56-1.81c3.55-1.08 9.46-.87 13.19 1.35a.95.95 0 01-.94 1.63z" />
            </svg>
          </div>
          <div className="site-nav__brand-copy">
            <span className="site-nav__brand-name">Spotify Dashboard</span>
            <span className="site-nav__brand-subtitle">Music workspace</span>
          </div>
        </div>

        {spotifyAuthenticated ? (
          <div className="site-nav__account">
            <div className="site-nav__avatar-menu" ref={avatarMenuRef}>
              <button
                type="button"
                className={`site-nav__account-button${
                  isProfilePage ? " site-nav__account-button--active" : ""
                }${isProfileMenuOpen ? " site-nav__account-button--open" : ""}`}
                aria-label="User menu"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setIsProfileMenuOpen((previous) => !previous);
                }}
              >
                {profileState.profileImageUrl ? (
                  <img
                    className="site-nav__avatar-image"
                    src={profileState.profileImageUrl}
                    alt={`${profileName} avatar`}
                  />
                ) : (
                  <span className="site-nav__avatar-fallback" aria-hidden="true">
                    {profileInitial}
                  </span>
                )}
                <span className="site-nav__account-copy">
                  <strong>{profileName}</strong>
                  <span>Open profile</span>
                </span>
              </button>
              {isProfileMenuOpen ? (
                <div className="site-nav__dropdown" role="menu" aria-label="User actions">
                  <Link
                    className="site-nav__dropdown-item"
                    href="/profile"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                    }}
                  >
                    Profile
                  </Link>
                  <a className="site-nav__dropdown-item" href="/api/auth/logout" role="menuitem">
                    Logout
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="site-nav__account site-nav__account--guest">
            <p className="site-nav__account-copy">
              <strong>Connect Spotify</strong>
              <span>Unlock reports and playback.</span>
            </p>
            <Link className="site-nav__connect-cta" href="/connect">
              Connect
            </Link>
          </div>
        )}

        <div className="site-nav__section">
          <p className="site-nav__section-label">Workspace</p>
          <div className="site-nav__links">
            {navItems.map((item) => {
              const isActive = item.isActive(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`site-nav__link${isActive ? " site-nav__link--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                  }}
                >
                  <NavIcon label={item.label} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="site-nav__footer">
          <div className="site-nav__theme-switch">
            <input
              id="site-theme-switch"
              ref={themeToggleRef}
              className="site-nav__theme-checkbox"
              type="checkbox"
              role="switch"
              aria-label="Toggle dark mode"
              onChange={(event) => {
                applyThemeMode(event.target.checked ? "dark" : "light");
              }}
            />
            <label className="site-nav__theme-label" htmlFor="site-theme-switch">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="site-nav__theme-icon site-nav__theme-icon--sun"
              >
                <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm9-7a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM6 12a1 1 0 0 1-1 1H4a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm10.36 6.95a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0ZM9.76 9.05a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0Zm6.6 0 .71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 1 1 1.41-1.41Zm-6.6 9.9.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 1 1 1.41-1.41Z" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="site-nav__theme-icon site-nav__theme-icon--moon"
              >
                <path d="M20.78 13.72A9 9 0 0 1 10.28 3.22a1 1 0 0 0-1.13-1.29A11 11 0 1 0 22.07 14.85a1 1 0 0 0-1.29-1.13Z" />
              </svg>
            </label>
          </div>
        </div>
      </nav>
    </aside>
  );
}
