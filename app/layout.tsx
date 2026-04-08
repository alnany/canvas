import type { Metadata } from "next";
import "./globals.css";
import { PrivyProviderWrapper } from "./components/PrivyProviderWrapper";

export const metadata: Metadata = {
  title: "CANVAS — Pixel War on Solana",
  description: "Claim pixels. Earn $CANVAS. Dominate the grid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PrivyProviderWrapper>
          {children}
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
