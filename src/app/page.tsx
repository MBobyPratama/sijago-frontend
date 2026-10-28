"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { PublicFaq } from "@/components/layout/PublicFaq";
import { BogorMap } from "@/components/map/BogorMap";
import { MOCK_REPORTS, ReportItem } from "@/lib/mockData";
import { apiFetch, getClientFingerprint } from "@/lib/api";
import { ThumbsUp, Plus, RefreshCw, MapPin, SlidersHorizontal, RotateCcw, CheckCheck, LocateFixed, ShieldCheck, ChevronRight, CircleHelp } from "lucide-react";
import "./public-map/public-map.css";

const CATEGORY_LABELS: Record<string, string> = {
  LUBANG: "Lubang", AMBLAS: "Amblas", RETAK: "Retak",
  BERGELOMBANG: "Bergelombang", GENANGAN_DRAINASE: "Genangan / drainase",
};
const DISTRICTS = ["Bogor Tengah", "Tanah Sareal", "Bogor Utara", "Bogor Selatan", "Bogor Timur", "Bogor Barat"];
const STATUS_LABELS: Record<string, string> = {
  TERVERIFIKASI: "Terverifikasi", DITERUSKAN: "Diteruskan", DIPROSES: "Diproses",
  SELESAI: "Selesai", DIBUKA_KEMBALI: "Dibuka kembali", DITUTUP: "Ditutup",
};
const PUBLIC_STATUSES = new Set(Object.keys(STATUS_LABELS));

export default function HomePage() {
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [reports, setReports] = useState<ReportItem[]>(
    MOCK_REPORTS.filter((r) => PUBLIC_STATUSES.has(r.status))
  );
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [mapResetKey, setMapResetKey] = useState(0);
  const requestVersion = useRef(0);
  const mapRegionRef = useRef<HTMLDivElement>(null);

  const fetchPublicReports = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (selectedDistrict !== "ALL") qs.set("district", selectedDistrict);
      if (selectedCategory !== "ALL") qs.set("category", selectedCategory);

      const res = await apiFetch<ReportItem[]>(`/v1/public/reports?${qs.toString()}`);
      if (version !== requestVersion.current) return;
      if (res.success && Array.isArray(res.data)) {
        setReports(res.data.filter((report) => PUBLIC_STATUSES.has(report.status)));
        setIsLiveDb(true);
      } else {
        throw new Error("Laporan belum tersedia");
      }
    } catch {
      if (version !== requestVersion.current) return;
      // Fallback ke data mock jika backend belum menyala
      setIsLiveDb(false);
      setReports(
        MOCK_REPORTS.filter(
          (r) =>
            PUBLIC_STATUSES.has(r.status) &&
            (selectedDistrict === "ALL" || r.districtName === selectedDistrict) &&
            (selectedCategory === "ALL" || r.category === selectedCategory)
        )
      );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [selectedDistrict, selectedCategory]);

  useEffect(() => {
    fetchPublicReports();
  }, [fetchPublicReports]);

  const toggleUpvote = async (id: string) => {
    try {
      const res = await apiFetch<{ upvoted: boolean; upvotesCount: number }>(
        `/v1/public/reports/${encodeURIComponent(id)}/upvote`,
        {
          method: "POST",
          body: JSON.stringify({ fingerprint: getClientFingerprint() }),
        }
      );
      if (res.success && res.data) {
        const { upvoted, upvotesCount } = res.data;
        setUpvotedIds((prev) => ({ ...prev, [id]: upvoted }));
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, upvotes: upvotesCount } : r))
        );
        return;
      }
    } catch {
      // Fallback local toggle
    }

    const next = !upvotedIds[id];
    setUpvotedIds((prev) => ({ ...prev, [id]: next }));
    setReports((list) => list.map((r) =>
      r.id === id ? { ...r, upvotes: Math.max(0, r.upvotes + (next ? 1 : -1)) } : r
    ));
  };

  const showReportOnMap = (id: string) => {
    setSelectedReportId((current) => current === id ? null : id);
    if (selectedReportId !== id && window.matchMedia("(max-width: 760px)").matches) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mapRegionRef.current?.focus({ preventScroll: true });
      mapRegionRef.current?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
    }
  };

  const hasFilters = selectedDistrict !== "ALL" || selectedCategory !== "ALL" || selectedStatus !== "ALL";
  const sortedReports = useMemo(() => reports
    .filter((report) => selectedStatus === "ALL" || report.status === selectedStatus)
    .sort((a, b) => b.priorityScore - a.priorityScore), [reports, selectedStatus]);

  useEffect(() => {
    setSelectedReportId(null);
  }, [selectedDistrict, selectedCategory, selectedStatus]);

  return (
    <main className="public-map">
      <section className="pm-image-hero" aria-labelledby="hero-heading">
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
      <div className="pm-container pm-map-content" id="peta-publik">
        <section aria-label="Peta dan laporan jalan" className="pm-workspace">
          <div className="pm-toolbar">
            <span className="pm-filter-label"><SlidersHorizontal size={17} aria-hidden="true" />Jelajahi laporan</span>
            <div className="pm-filters">
              <label>
                <span className="pm-sr-only">Kecamatan</span>
                <select name="kecamatan" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                  <option value="ALL">Semua kecamatan</option>
                  {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </label>
              <label>
                <span className="pm-sr-only">Jenis kerusakan</span>
                <select name="kerusakan" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="ALL">Semua kerusakan</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span className="pm-sr-only">Status laporan</span>
                <select name="status" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="ALL">Semua status</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <button type="button" onClick={fetchPublicReports} disabled={loading} aria-label="Perbarui laporan" title="Perbarui laporan" className="pm-icon-button">
              <RefreshCw size={17} className={loading ? "pm-spinning" : ""} aria-hidden="true" />
            </button>
          </div>

          <div className="pm-map-layout">
            <aside className="pm-reports" aria-label="Daftar laporan" aria-busy={loading}>
              <div className="pm-list-heading">
                <h2>Laporan warga <span>{sortedReports.length}</span></h2>
                <span className="pm-sort-label">Prioritas tertinggi</span>
              </div>
              <div className="pm-report-scroll">
                {sortedReports.length === 0 && <div className="pm-empty" role="status">
                  <MapPin size={28} aria-hidden="true" />
                  <h3>Belum ada laporan</h3>
                  <p>Coba pilih kecamatan atau jenis kerusakan lain.</p>
                  <button type="button" onClick={() => { setSelectedDistrict("ALL"); setSelectedCategory("ALL"); setSelectedStatus("ALL"); }} className="pm-text-button">Tampilkan semua laporan</button>
                </div>}
                {sortedReports.map((rep) => {
                  const isUpvoted = Boolean(upvotedIds[rep.id]);
                  const isSelected = selectedReportId === rep.id;
                  return (
                    <article key={rep.id} className={`pm-report ${isSelected ? "pm-report-selected" : ""}`}>
                      <div className="pm-report-meta">
                        <span className={`pm-status pm-status-${rep.status.toLowerCase()}`}>{STATUS_LABELS[rep.status]}</span>
                        <span className="pm-ticket">{rep.ticketCode}</span>
                      </div>
                      <h3><Link href={`/laporan/${rep.id}`}>{rep.title}</Link></h3>
                      <p className="pm-location"><MapPin size={14} aria-hidden="true" />{rep.districtName}<span className="pm-category">{CATEGORY_LABELS[rep.category]}</span></p>
                      <p className={`pm-draft ${rep.draftSource === "AI" ? "pm-draft-ai" : ""}`}>{rep.permanentLabel}</p>
                      {rep.status === "SELESAI" && <p className="pm-monitoring">Dalam pemantauan 30 hari</p>}
                      <details className="pm-report-summary">
                        <summary>Ringkasan laporan</summary>
                        <div><p>{rep.body}</p>
                          {rep.isRecurrentHotspot && <p className="pm-recurrence">Kerusakan berulang di titik ini.</p>}
                          {rep.conditionTags.map((tag) => <p key={tag.code}>{tag.label} ({tag.count})</p>)}
                        </div>
                      </details>
                      <div className="pm-report-actions">
                        <button type="button" onClick={() => toggleUpvote(rep.id)} aria-pressed={isUpvoted} className={`pm-upvote ${isUpvoted ? "pm-upvoted" : ""}`}>
                          <ThumbsUp size={15} aria-hidden="true" />{isUpvoted ? "Didukung" : "Saya lewat sini"}<span>{rep.upvotes}</span>
                        </button>
                        <Link href={`/laporan/${rep.id}`} aria-label={`Lihat laporan ${rep.ticketCode}`} className="pm-detail-link">Detail<ChevronRight size={16} aria-hidden="true" /></Link>
                      </div>
                      <button type="button" aria-pressed={isSelected} onClick={() => showReportOnMap(rep.id)} className="pm-show-map"><LocateFixed size={14} aria-hidden="true" />{isSelected ? "Lokasi dipilih" : "Lihat di peta"}</button>
                    </article>
                  );
                })}
              </div>
              <div className="pm-list-note"><ShieldCheck size={16} aria-hidden="true" /><p>Hanya laporan terverifikasi yang ditampilkan.</p></div>
            </aside>

            <div className="pm-map-region" ref={mapRegionRef} tabIndex={-1} aria-label="Peta lokasi laporan">
              <div className="pm-map-stage">
                <BogorMap reports={sortedReports} selectedReportId={selectedReportId} onSelectReport={setSelectedReportId} resetViewKey={mapResetKey} className="pm-map-canvas" />
                <div className="pm-map-caption"><MapPin size={16} aria-hidden="true" />Kota Bogor</div>
                <button type="button" className="pm-map-reset" onClick={() => { setSelectedReportId(null); setMapResetKey((value) => value + 1); }}><LocateFixed size={16} aria-hidden="true" />Semua titik</button>
              </div>
              <div className="pm-legend" aria-label="Legenda status laporan">
                {Object.entries(STATUS_LABELS).map(([status, label]) => <span key={status} className="pm-legend-item"><span className={`pm-map-key pm-key-${status.toLowerCase()}`} aria-hidden="true" />{label}</span>)}
              </div>
            </div>
          </div>
          <div className="pm-workspace-footer">
            <p role="status" className="pm-data-status">{loading ? <RefreshCw size={15} className="pm-spinning" aria-hidden="true" /> : <CheckCheck size={16} aria-hidden="true" />}{loading ? "Memuat laporan…" : isLiveDb ? "Data laporan terbaru" : "Menampilkan data contoh"}</p>
            {hasFilters && <button type="button" onClick={() => { setSelectedDistrict("ALL"); setSelectedCategory("ALL"); setSelectedStatus("ALL"); }} className="pm-text-button"><RotateCcw size={14} aria-hidden="true" />Reset filter</button>}
            <p className="pm-map-hint">Pilih titik untuk melihat laporan.</p>
          </div>
        </section>
        <div className="pm-community-note"><CircleHelp size={19} aria-hidden="true" /><p>Sudah ada laporan di lokasi yang sama? Beri dukungan <strong>“Saya lewat sini”</strong> agar tidak perlu membuat laporan baru.</p></div>
      </div>
      <PublicFaq />
    </main>
  );
}
