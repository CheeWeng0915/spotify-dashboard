export type NavbarItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

export const NAV_ITEMS: NavbarItem[] = [
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
