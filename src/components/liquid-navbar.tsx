"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDashboardProfileState } from "@/components/use-dashboard-state";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Overview",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/reports/daily",
    label: "Reports",
    isActive: (pathname: string) => pathname.startsWith("/reports/"),
  },
  {
    href: "/library/artists/daily",
    label: "Artists",
    isActive: (pathname: string) => pathname.startsWith("/library/artists"),
  },
  {
    href: "/library/albums/daily",
    label: "Albums",
    isActive: (pathname: string) => pathname.startsWith("/library/albums"),
  },
];

export function LiquidNavbar() {
  const pathname = usePathname();
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const profileState = useDashboardProfileState();
  const activeIndex = useMemo(
    () => NAV_ITEMS.findIndex((item) => item.isActive(pathname)),
    [pathname],
  );

  const moveIndicatorTo = useCallback((index: number) => {
    const linkElement = linkRefs.current[index];
    const indicatorElement = indicatorRef.current;

    if (!linkElement || !indicatorElement) {
      return;
    }

    indicatorElement.style.setProperty(
      "--site-nav-indicator-x",
      `${linkElement.offsetLeft}px`,
    );
    indicatorElement.style.setProperty(
      "--site-nav-indicator-width",
      `${linkElement.offsetWidth}px`,
    );
    indicatorElement.classList.add("site-nav__indicator--visible");
  }, []);

  useEffect(() => {
    if (activeIndex < 0) {
      indicatorRef.current?.classList.remove("site-nav__indicator--visible");
      return;
    }

    moveIndicatorTo(activeIndex);
  }, [activeIndex, moveIndicatorTo]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    const handleResize = () => {
      moveIndicatorTo(activeIndex);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeIndex, moveIndicatorTo]);

  return (
    <header className="site-nav-wrap">
      <nav className="site-nav" aria-label="Primary">
        <span ref={indicatorRef} aria-hidden="true" className="site-nav__indicator" />
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
          >
            {item.label}
          </Link>
        ))}
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
