import Image from "next/image";
import Link from "next/link";
import { Plus, ChevronRight, CircleHelp } from "lucide-react";
import { PublicFaq } from "@/components/layout/PublicFaq";
import { AgencyCarousel } from "@/components/AgencyCarousel";
import { PublicMapWorkspace } from "./public-map/PublicMapWorkspace";
import "./public-map/public-map.css";

export default function HomePage() {
  return (
    <main className="public-map">
      <section className="pm-image-hero" aria-labelledby="hero-heading">
        <Image
          src="/images/hero_background.avif"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="pm-hero-bg"
        />
        <div className="pm-container">
          <div className="pm-hero-content">
            <h1 id="hero-heading">Jalan lebih baik,<br />mulai dari laporan Anda.</h1>
            <p>Laporkan jalan rusak di Kota Bogor dan pantau perbaikannya bersama warga. Tanpa perlu membuat akun.</p>
            <div className="pm-hero-actions">
              <Link href="/lapor" className="pm-primary"><Plus size={18} aria-hidden="true" />Lapor jalan rusak</Link>
              <a href="#peta-publik" className="pm-hero-secondary">Jelajahi peta laporan<ChevronRight size={18} aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </section>
      <AgencyCarousel />
      <div className="pm-container pm-map-content" id="peta-publik">
        <PublicMapWorkspace />
        <div className="pm-community-note"><CircleHelp size={19} aria-hidden="true" /><p>Sudah ada laporan di lokasi yang sama? Beri dukungan <strong>“Saya lewat sini”</strong> agar tidak perlu membuat laporan baru.</p></div>
      </div>
      <PublicFaq />
    </main>
  );
}
