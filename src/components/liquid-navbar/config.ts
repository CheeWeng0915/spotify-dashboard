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

  items.push(
    spotifyAuthenticated
      ? {
          href: "/profile",
          label: "Profile",
          isActive: (pathname: string) => pathname.startsWith("/profile"),
        }
      : {
          href: "/connect",
          label: "Connect",
          isActive: (pathname: string) => pathname.startsWith("/connect"),
        },
  );

  return items;
}
