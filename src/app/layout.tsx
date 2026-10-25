import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIJAGO — Sistem Jalan Bogor | Civic-Tech & Weather-Road Intelligence",
  description:
    "Platform Pelaporan Kerusakan Jalan Kota Bogor dengan AI Human-in-the-Loop dan Analitik Cuaca Ekstrem (MIA2026).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
