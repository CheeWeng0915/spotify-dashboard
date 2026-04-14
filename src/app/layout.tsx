import type { Metadata } from "next";
import { LiquidNavbar } from "@/components/liquid-navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify Reports",
  description: "Apple-style liquid glass Spotify listening reports.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <LiquidNavbar />
          {children}
        </div>
      </body>
    </html>
  );
}
