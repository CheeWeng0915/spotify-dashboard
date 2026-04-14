"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { NavbarItem } from "@/components/liquid-navbar/config";

type UseNavIndicatorInput = {
  pathname: string;
  items: NavbarItem[];
};

export function useNavIndicator({ pathname, items }: UseNavIndicatorInput) {
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const activeIndex = useMemo(
    () => items.findIndex((item) => item.isActive(pathname)),
    [items, pathname],
  );

  const moveIndicatorTo = useCallback((index: number) => {
    const linkElement = linkRefs.current[index];
    const indicatorElement = indicatorRef.current;
    const navElement = indicatorElement?.closest(".site-nav") as HTMLElement | null;

    if (!linkElement || !indicatorElement || !navElement) {
      return;
    }

    const linkRect = linkElement.getBoundingClientRect();
    const navRect = navElement.getBoundingClientRect();
    const navPaddingLeft = Number.parseFloat(
      getComputedStyle(navElement).getPropertyValue("--site-nav-pad"),
    );
    const x = Math.max(0, linkRect.left - navRect.left - (Number.isNaN(navPaddingLeft) ? 0 : navPaddingLeft));

    indicatorElement.style.setProperty(
      "--site-nav-indicator-x",
      `${x}px`,
    );
    indicatorElement.style.setProperty(
      "--site-nav-indicator-width",
      `${linkRect.width}px`,
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

    const handleLayoutChange = () => {
      moveIndicatorTo(activeIndex);
    };
    const activeLink = linkRefs.current[activeIndex];
    const linksContainer = activeLink?.parentElement;
    const navElement = indicatorRef.current?.closest(".site-nav") as
      | HTMLElement
      | null;

    window.addEventListener("resize", handleLayoutChange);
    linksContainer?.addEventListener("scroll", handleLayoutChange, {
      passive: true,
    });

    if (typeof ResizeObserver === "undefined" || !navElement) {
      return () => {
        window.removeEventListener("resize", handleLayoutChange);
        linksContainer?.removeEventListener("scroll", handleLayoutChange);
      };
    }

    const observer = new ResizeObserver(() => {
      moveIndicatorTo(activeIndex);
    });

    observer.observe(navElement);
    linkRefs.current.forEach((link) => {
      if (link) {
        observer.observe(link);
      }
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleLayoutChange);
      linksContainer?.removeEventListener("scroll", handleLayoutChange);
    };
  }, [activeIndex, moveIndicatorTo]);

  return {
    indicatorRef,
    linkRefs,
    moveIndicatorTo,
  };
}
