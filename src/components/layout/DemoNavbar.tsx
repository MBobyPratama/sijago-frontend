"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import "./admin-navigation.css";
import { usePathname } from "next/navigation";
import {
  MapPin,
  FilePlus2,
  SearchCheck,
  ShieldCheck,
  ScrollText,
  SlidersHorizontal,
  Building2,
  CloudRainWind,
  Palette,
} from "lucide-react";

const NAV_GROUPS = [
  {
    roleLabel: "📱 Sisi Warga",
    badgeClass: "bg-blue-900/60 text-blue-100 border-blue-700",
    links: [
      { href: "/", label: "Peta Publik (F4)", icon: MapPin },
      { href: "/lapor", label: "+ Lapor Jalan (F1-F3)", icon: FilePlus2 },
      { href: "/lacak", label: "Lacak Tiket (F8)", icon: SearchCheck },
    ],
  },
  {
    roleLabel: "🛡️ Sisi Admin SIJAGO",
    badgeClass: "bg-indigo-900/60 text-indigo-100 border-indigo-700",
    links: [
      { href: "/admin/moderasi", label: "Antrean Moderasi (F5)", icon: ShieldCheck },
      { href: "/admin/audit", label: "Audit Log (F7)", icon: ScrollText },
      { href: "/admin/pengaturan", label: "Konfigurasi (US-20)", icon: SlidersHorizontal },
    ],
  },
  {
    roleLabel: "🏛️ Sisi Instansi (Simulasi)",
    badgeClass: "bg-emerald-900/60 text-emerald-100 border-emerald-700",
    links: [
      { href: "/instansi/laporan", label: "Portal PUPR (F6)", icon: Building2 },
      {
        href: "/instansi/weather-intelligence",
        label: "Weather-Road Intel (F9)",
        icon: CloudRainWind,
      },
    ],
  },
];

export function DemoNavbar() {
  const pathname = usePathname();

  if (pathname === "/instansi/laporan" || pathname === "/instansi/weather-intelligence") {
    const agencyLinks=[{href:"/instansi/laporan",label:"Laporan instansi"},{href:"/instansi/weather-intelligence",label:"Analisis cuaca"}];
    const moreLinks=[{href:"/",label:"Peta publik"},{href:"/lapor",label:"Lapor jalan rusak"},{href:"/lacak",label:"Lacak laporan"},{href:"/laporan/SJG-2026-1042",label:"Contoh detail laporan"},{href:"/admin/moderasi",label:"Moderasi"},{href:"/admin/audit",label:"Audit log"},{href:"/admin/pengaturan",label:"Pengaturan"},{href:"/theme-guide",label:"Panduan desain"}];
    return <header className="admin-app-header"><div className="admin-header-container"><Link href="/" className="admin-header-logo" aria-label="SIJAGO, beranda"><Image src="/images/logo_header.svg" alt="SIJAGO, Sistem Jalan Bogor" width={190} height={66} priority/></Link><nav className="admin-header-nav" aria-label="Navigasi instansi">{agencyLinks.map(item=><Link href={item.href} key={item.href} aria-current={pathname===item.href?"page":undefined} className="admin-desktop-link">{item.label}</Link>)}<details className="admin-header-menu"><summary>Menu</summary><div>{agencyLinks.map(item=><Link href={item.href} key={item.href} className="admin-mobile-link" aria-current={pathname===item.href?"page":undefined}>{item.label}</Link>)}{moreLinks.map(item=><Link href={item.href} key={item.href}>{item.label}</Link>)}</div></details></nav></div></header>;
  }

  if (pathname === "/admin/moderasi" || pathname === "/admin/audit" || pathname === "/admin/pengaturan") {
    const adminLinks = [{href:"/admin/moderasi",label:"Moderasi"},{href:"/admin/audit",label:"Audit log"},{href:"/admin/pengaturan",label:"Pengaturan"}];
    const otherLinks = [{href:"/",label:"Peta publik"},{href:"/lapor",label:"Lapor jalan rusak"},{href:"/lacak",label:"Lacak laporan"},{href:"/laporan/SJG-2026-1042",label:"Contoh detail laporan"},{href:"/instansi/laporan",label:"Portal instansi"},{href:"/instansi/weather-intelligence",label:"Weather-Road Intel"},{href:"/theme-guide",label:"Panduan desain"}];
    return <header className="admin-app-header"><div className="admin-header-container"><Link href="/" aria-label="SIJAGO, beranda" className="admin-header-logo"><Image src="/images/logo_header.svg" alt="SIJAGO, Sistem Jalan Bogor" width={190} height={66} priority /></Link><nav aria-label="Navigasi admin" className="admin-header-nav">{adminLinks.map(item=><Link key={item.href} href={item.href} aria-current={pathname===item.href?"page":undefined} className="admin-desktop-link">{item.label}</Link>)}<details className="admin-header-menu"><summary>Menu</summary><div>{adminLinks.map(item=><Link key={item.href} href={item.href} aria-current={pathname===item.href?"page":undefined} className="admin-mobile-link">{item.label}</Link>)}{otherLinks.map(item=><Link key={item.href} href={item.href}>{item.label}</Link>)}</div></details></nav></div></header>;
  }

  if (pathname === "/" || pathname === "/lapor" || pathname === "/lacak" || pathname === "/theme-guide" || pathname?.startsWith("/laporan/")) {
    return (
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="SIJAGO, beranda">
            <Image src="/images/logo_header.svg" alt="SIJAGO, Sistem Jalan Bogor" width={380} height={132} priority className="h-auto w-24 sm:w-36 lg:w-40" />
          </Link>
          <nav aria-label="Navigasi utama" className="ml-auto flex items-center gap-1 whitespace-nowrap sm:gap-3">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={`hidden min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium md:inline-flex ${pathname === "/" ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100"}`}>Peta publik</Link>
            <Link href="/lacak" aria-current={pathname === "/lacak" ? "page" : undefined} className={`hidden min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium md:inline-flex ${pathname === "/lacak" ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100"}`}>Lacak laporan</Link>
            <details className="relative">
              <summary className="flex min-h-11 cursor-pointer items-center rounded-lg px-2 py-2.5 text-xs text-slate-600 hover:bg-slate-100"><span className="md:hidden">Menu</span><span className="hidden md:inline">Menu lainnya</span></summary>
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className="block rounded-lg px-3 py-3 text-sm text-blue-800 hover:bg-slate-50 md:hidden">Peta publik</Link>
                <Link href="/lacak" aria-current={pathname === "/lacak" ? "page" : undefined} className="block rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 md:hidden">Lacak laporan</Link>
                <Link href="/lapor" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Lapor jalan rusak</Link>
                {NAV_GROUPS.slice(1).flatMap((group) => group.links).map((item) => <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">{item.label.replace(/ \(.*\)/, "")}</Link>)}
                <Link href="/theme-guide" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Panduan desain</Link>
                {(pathname === "/lapor" || pathname === "/lacak") && <Link href="/laporan/SJG-2026-1042" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Contoh detail & sign-off</Link>}
              </div>
            </details>
            <Link href="/lapor" aria-current={pathname === "/lapor" ? "page" : undefined} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-sijago-primary px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 sm:px-4 sm:text-sm">Lapor jalan rusak</Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Baris Atas: Brand SIJAGO & Info Wireframe */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-extrabold text-lg tracking-tight flex items-center gap-2">
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-mono">
              SIJAGO
            </span>
            <span>Sistem Jalan Bogor</span>
          </Link>
          <span className="hidden md:inline-block text-xs text-slate-400 border-l border-slate-700 pl-3">
            MVP Fullstack SIJAGO (Milestone 1–4 Selesai • Acuan Figma Sabira & Boby • MIA2026)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/theme-guide"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-bold border transition ${
              pathname === "/theme-guide"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Theme Guide (Acuan Desain Figma)
          </Link>
          <Link
            href="/laporan/SJG-2026-1042"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 transition"
          >
            Contoh Detail & Sign-Off (F10) →
          </Link>
        </div>
      </div>

      {/* Baris Bawah: Role Switcher & Semua 8 Layar Utama */}
      <div className="max-w-7xl mx-auto px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          {NAV_GROUPS.map((group) => (
            <div key={group.roleLabel} className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${group.badgeClass}`}
              >
                {group.roleLabel}
              </span>
              <div className="flex items-center gap-1">
                {group.links.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
