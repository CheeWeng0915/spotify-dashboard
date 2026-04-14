export type NavbarItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

export const NAV_ITEMS: NavbarItem[] = [
  {
    href: "/",
    label: "Dashboard",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/reports/daily",
    label: "Tracks",
    isActive: (pathname: string) => pathname.startsWith("/reports/"),
  },
  {
    href: "/connect",
    label: "Connect",
    isActive: (pathname: string) =>
      pathname.startsWith("/connect") || pathname.startsWith("/profile"),
  },
];
