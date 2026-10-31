"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, Building2, ChevronRight, LogOut, CloudRainWind, Menu, Palette, ScrollText, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { DemoNavbar } from "./DemoNavbar";
import { SiteFooter } from "./SiteFooter";
import { CitizenThemeSelect } from "./CitizenTheme";
import { useAuth } from "./AuthProvider";
import "./dashboard-layout.css";

const ADMIN_LINKS = [
  { href: "/admin/moderasi", label: "Moderasi laporan", icon: ShieldCheck },
  { href: "/admin/audit", label: "Riwayat audit", icon: ScrollText },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: SlidersHorizontal },
];
const AGENCY_LINKS = [
  { href: "/instansi/laporan", label: "Laporan instansi", icon: Building2 },
  { href: "/instansi/weather-intelligence", label: "Analisis cuaca", icon: CloudRainWind },
];


function DashboardShell({ children, agency }: { children: React.ReactNode; agency: boolean }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const links = agency ? AGENCY_LINKS : user?.role === "AUDITOR" ? ADMIN_LINKS.filter(link => link.href === "/admin/audit") : ADMIN_LINKS;
  const role = agency ? "Portal instansi" : user?.role === "AUDITOR" ? "Audit SIJAGO" : "Admin SIJAGO";
  const currentTitle = links.find(item => item.href === pathname)?.label || "Dashboard";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => dialogRef.current?.close();

  useEffect(() => { dialogRef.current?.close(); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) dialogRef.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    return () => { document.body.style.overflowY = previous; };
  }, [drawerOpen]);

  const sidebar = (mobile: boolean) => <>
    <div className="dashboard-brand">
      <Link href="/" aria-label="SIJAGO, beranda"><Image src="/images/logo_header.svg" alt="SIJAGO, Sistem Jalan Bogor" width={190} height={66} priority={!mobile} className="citizen-logo-light" /><Image src="/images/logo_header_dark.svg" alt="SIJAGO, Sistem Jalan Bogor" width={190} height={66} className="citizen-logo-dark" /></Link>
      {mobile && <button type="button" onClick={closeDrawer} className="dashboard-icon-button" aria-label="Tutup menu" autoFocus><X size={20} aria-hidden="true" /></button>}
    </div>
    <div className="dashboard-sidebar-body">
      <p className="dashboard-nav-label">{role}</p>
      <nav aria-label={mobile ? `Menu ${role}` : `Navigasi ${role}`} className="dashboard-navigation">
        {links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined} onClick={() => { if (pathname === href) closeDrawer(); }}><Icon size={19} aria-hidden="true" /><span>{label}</span></Link>)}
      </nav>
      <div className="dashboard-sidebar-divider" />
      <Link href="/" className="dashboard-back-public"><ArrowLeft size={18} aria-hidden="true" /><span>Kembali ke halaman warga</span></Link>
      <div className="dashboard-sidebar-bottom dashboard-navigation dashboard-secondary">
        {user && ["ADMIN", "SUPER_ADMIN"].includes(user.role) && <Link href={agency ? "/admin/moderasi" : "/instansi/laporan"}>{agency ? <ShieldCheck size={18} aria-hidden="true" /> : <Building2 size={18} aria-hidden="true" />}<span>{agency ? "Buka admin" : "Buka portal instansi"}</span></Link>}
        <Link href="/theme-guide"><Palette size={18} aria-hidden="true" /><span>Panduan desain</span></Link>
      </div>
    </div>
  </>;

  return <div className="dashboard-shell">
    <a href="#dashboard-content" className="dashboard-skip-link">Lewati navigasi</a>
    <aside className="dashboard-sidebar" aria-label="Menu dashboard">{sidebar(false)}</aside>
    <dialog ref={dialogRef} className="dashboard-drawer" aria-label={`Navigasi ${role}`} onClose={() => { setDrawerOpen(false); menuRef.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) closeDrawer(); }}>
      <div className="dashboard-drawer-content">{sidebar(true)}</div>
    </dialog>
    <div className="dashboard-workarea">
      <header className="dashboard-topbar">
        <button ref={menuRef} type="button" className="dashboard-menu-button" aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={() => { dialogRef.current?.showModal(); setDrawerOpen(true); }}><Menu size={20} aria-hidden="true" /><span>Menu</span></button>
        <div className="dashboard-breadcrumb"><span>{role}</span><ChevronRight size={15} aria-hidden="true" /><span>{currentTitle}</span></div>
        <div className="dashboard-account">{user && <span>{user.fullName}</span>}<button type="button" className="dashboard-logout" disabled={loggingOut} onClick={async () => { setLoggingOut(true); setLogoutError(null); try { await logout(); } catch (error) { setLogoutError(error instanceof Error ? error.message : "Belum berhasil keluar."); setLoggingOut(false); } }}><LogOut size={17} aria-hidden="true" />{loggingOut ? "Keluar…" : "Keluar"}</button><CitizenThemeSelect className="dashboard-theme-select" /></div>
      </header>
      {logoutError && <p className="dashboard-auth-error" role="alert">{logoutError}</p>}
      <div id="dashboard-content" className="dashboard-content" tabIndex={-1}>{children}</div>
      <footer className="dashboard-footer"><span>© 2026 SIJAGO. Sistem Jalan Bogor.</span><Link href="/">Kembali ke halaman warga</Link></footer>
    </div>
  </div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  if (pathname.startsWith("/admin/") || pathname.startsWith("/instansi/")) return <DashboardShell agency={pathname.startsWith("/instansi/")}>{children}</DashboardShell>;
  return <><DemoNavbar /><div className="flex-1">{children}</div><SiteFooter /></>;
}
