import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RelayCore — Event Relay Control Panel",
  description: "Personal serverless event relay control panel for Vercel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <div className="scan-line" />
        {children}
      </body>
    </html>
  );
}
