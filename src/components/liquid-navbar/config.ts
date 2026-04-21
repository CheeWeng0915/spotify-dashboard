export type NavbarItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

export function getNavItems(spotifyAuthenticated: boolean): NavbarItem[] {
  if (!spotifyAuthenticated) {
    return [
      {
        href: "/connect",
        label: "Connect",
        isActive: (pathname: string) => pathname.startsWith("/connect"),
      },
    ];
  }

  const items: NavbarItem[] = [
    {
      href: "/",
      label: "Search",
      isActive: (pathname: string) => pathname === "/",
    },
    {
      href: "/library",
      label: "Library",
      isActive: (pathname: string) => pathname.startsWith("/library"),
    },
    {
      href: "/reports/daily",
      label: "Reports",
      isActive: (pathname: string) => pathname.startsWith("/reports/"),
    },
    {
      href: "/organizer",
      label: "Organizer",
      isActive: (pathname: string) => pathname.startsWith("/organizer"),
    },
    {
      href: "/dashboard",
      label: "Player",
      isActive: (pathname: string) => pathname.startsWith("/dashboard"),
    },
    {
      href: "/discover",
      label: "Discover",
      isActive: (pathname: string) => pathname.startsWith("/discover"),
    },
  ];

  return items;
}
