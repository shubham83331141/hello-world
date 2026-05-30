import type { Metadata } from "next";
import "./globals.css";

import AppShell from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "TileSHowcase",
  description: "Luxury tile showroom catalog, compare, and quick deal builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
