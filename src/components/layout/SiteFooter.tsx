import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="site-footer border-t border-slate-200 bg-white text-slate-500" aria-label="Informasi dan navigasi SIJAGO">
      <div className="site-footer-container">
        <div className="site-footer-brand-row">
          <Image src="/images/logo.svg" alt="" width={96} height={96} className="site-footer-logo" />
          <h2 className="site-footer-brand">SIJAGO</h2>
        </div>
        <hr className="site-footer-divider border-slate-200" />
        <div className="site-footer-information">
          <p className="site-footer-description">
            Sistem Jalan Bogor. Platform partisipasi dan pengawasan warga untuk melaporkan kerusakan jalan dan memantau perbaikannya di Kota Bogor.
          </p>
          <nav className="site-footer-navigation" aria-label="Navigasi footer">
            <Link href="/">Peta publik</Link>
            <Link href="/lacak">Lacak laporan</Link>
            <Link href="/lapor">Lapor jalan rusak</Link>
          </nav>
        </div>
        <div className="site-footer-bottom">
          <p>© 2026 SIJAGO (Sistem Jalan Bogor). Proyek Kompetisi MIA2026 (Sabira &amp; Boby).</p>
          <p>Disclaimer: Waktu pelaksanaan perbaikan fisik sepenuhnya menjadi kewenangan instansi terkait.</p>
        </div>
      </div>
    </footer>
  );
}
