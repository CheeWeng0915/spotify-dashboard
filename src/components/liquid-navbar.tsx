"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNavItems } from "@/components/liquid-navbar/config";
import { useDashboardProfileState } from "@/components/use-dashboard-state";

function NavIcon({ label }: { label: string }) {
  if (label === "Reports") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M9 18.5A3.5 3.5 0 1 1 7 15.34V5.5c0-.48.34-.9.81-.98l10-1.8A1 1 0 0 1 19 3.7v11.8a3.5 3.5 0 1 1-2-3.16V7.3l-8 1.44v9.76Z" />
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
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function LiquidNavbar({ spotifyAuthenticated }: LiquidNavbarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(spotifyAuthenticated);
  const profileState = useDashboardProfileState();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  const profileName = profileState.profileName || "Spotify User";
  const profileInitial = profileName.charAt(0).toUpperCase();
  const isProfilePage = pathname.startsWith("/profile");

  useEffect(() => {
    const initialThemeMode = getInitialThemeMode();
    document.documentElement.dataset.theme = initialThemeMode;
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

  function toggleThemeMode() {
    const activeThemeMode: ThemeMode =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextThemeMode: ThemeMode = activeThemeMode === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextThemeMode);
    document.documentElement.dataset.theme = nextThemeMode;
  }

  return (
    <header className="site-nav-wrap">
      <nav className="site-nav" aria-label="Primary">
        <div className="site-nav__inner">
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

            {spotifyAuthenticated ? (
              <div className="site-nav__avatar-menu" ref={avatarMenuRef}>
                <button
                  type="button"
                  className={`site-nav__link site-nav__link--avatar${
                    isProfilePage ? " site-nav__link--active" : ""
                  }${isProfileMenuOpen ? " site-nav__link--open" : ""}`}
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
                    <span className="site-nav__avatar-fallback" aria-hidden>
                      {profileInitial}
                    </span>
                  )}
                  <span className="site-nav__sr-only">Open user menu</span>
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
            ) : null}
          </div>
          <button
            type="button"
            className="site-nav__theme-toggle"
            aria-label="Toggle dark mode"
            onClick={toggleThemeMode}
          >
            Theme
          </button>
        </div>
      </nav>
    </header>
  );
}
