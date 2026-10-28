import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DemoNavbar } from "@/components/layout/DemoNavbar";
import { SiteFooter } from "@/components/layout/SiteFooter";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  title: "SIJAGO - Sistem Jalan Bogor | Civic-Tech & Weather-Road Intelligence",
  description:
    "Platform Pelaporan Kerusakan Jalan Kota Bogor dengan AI Human-in-the-Loop dan Analitik Cuaca Ekstrem (MIA2026).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
        <DemoNavbar />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
