"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  if (label === "Profile") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="site-nav__icon">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
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

export function LiquidNavbar({ spotifyAuthenticated }: LiquidNavbarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(spotifyAuthenticated);
  const profileState = useDashboardProfileState();

  const profileName = profileState.profileName || "Spotify User";
  const profileInitial = profileName.charAt(0).toUpperCase();

  return (
    <header className="site-nav-wrap">
      <nav className="site-nav" aria-label="Primary">
        <div className="site-nav__links">
          {navItems.map((item) => {
            const isActive = item.isActive(pathname);
            const isProfileItem = item.label === "Profile";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav__link${
                  isActive ? " site-nav__link--active" : ""
                }${isProfileItem ? " site-nav__link--avatar" : ""}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={isProfileItem ? "Profile" : undefined}
              >
                {isProfileItem ? (
                  <>
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
                    <span className="site-nav__sr-only">Profile</span>
                  </>
                ) : (
                  <>
                    <NavIcon label={item.label} />
                    <span>{item.label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
