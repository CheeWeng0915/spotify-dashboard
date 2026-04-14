"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/liquid-navbar/config";
import { useNavIndicator } from "@/components/liquid-navbar/use-nav-indicator";
import { useDashboardProfileState } from "@/components/use-dashboard-state";

export function LiquidNavbar() {
  const pathname = usePathname();
  const profileState = useDashboardProfileState();
  const { indicatorRef, linkRefs, moveIndicatorTo } = useNavIndicator({
    pathname,
    items: NAV_ITEMS,
  });

  return (
    <header className="site-nav-wrap">
      <nav className="site-nav" aria-label="Primary">
        <span ref={indicatorRef} aria-hidden="true" className="site-nav__indicator" />
        <div className="site-nav__links">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              ref={(element) => {
                linkRefs.current[index] = element;
              }}
              className={`site-nav__link${
                item.isActive(pathname) ? " site-nav__link--active" : ""
              }`}
              onPointerDown={() => {
                moveIndicatorTo(index);
              }}
              onFocus={() => {
                moveIndicatorTo(index);
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {profileState.spotifyAuthenticated ? (
          <Link className="site-nav__avatar-link" href="/profile" aria-label="Open profile">
            {profileState.profileImageUrl ? (
              <img
                className="site-nav__avatar-image"
                src={profileState.profileImageUrl}
                alt={`${profileState.profileName} avatar`}
              />
            ) : (
              <span className="site-nav__avatar-fallback" aria-hidden>
                {profileState.profileName.charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
        ) : (
          <Link className="site-nav__connect" href="/connect">
            Connect
          </Link>
        )}
      </nav>
    </header>
  );
}
