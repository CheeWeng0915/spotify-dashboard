"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/liquid-navbar/config";
import { useNavIndicator } from "@/components/liquid-navbar/use-nav-indicator";

function NavIcon({ label }: { label: string }) {
  if (label === "Tracks") {
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

export function LiquidNavbar() {
  const pathname = usePathname();
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
              <NavIcon label={item.label} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
