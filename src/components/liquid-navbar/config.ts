export type NavbarItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

export function getNavItems(spotifyAuthenticated: boolean): NavbarItem[] {
  const items: NavbarItem[] = [
    {
      href: "/",
      label: "Dashboard",
      isActive: (pathname: string) => pathname === "/",
    },
    {
      href: "/reports/daily",
      label: "Reports",
      isActive: (pathname: string) => pathname.startsWith("/reports/"),
    },
  ];

  if (!spotifyAuthenticated) {
    items.push({
      href: "/connect",
      label: "Connect",
      isActive: (pathname: string) => pathname.startsWith("/connect"),
    });
  }

  return items;
}
