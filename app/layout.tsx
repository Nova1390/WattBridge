import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WattBridge",
  description: "Home energy orchestration dashboard",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#154734",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
