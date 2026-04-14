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

  return {
    indicatorRef,
    linkRefs,
    moveIndicatorTo,
  };
}
