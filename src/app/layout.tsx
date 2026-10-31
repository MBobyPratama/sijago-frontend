import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { CitizenThemeProvider } from "@/components/layout/CitizenTheme";
import { citizenThemeScript } from "@/components/layout/citizen-theme-config";
import "@/components/layout/citizen-theme.css";

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
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: citizenThemeScript }} /></head>
      <body className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
        <CitizenThemeProvider>
        <AuthProvider><AppShell>{children}</AppShell></AuthProvider>
        </CitizenThemeProvider>
      </body>
    </html>
  );
}
