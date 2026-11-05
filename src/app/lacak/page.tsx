"use client";

import { SavedTickets } from "@/components/SavedTickets";
import { PhotoPreview } from "@/components/PhotoPreview";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { browserApiBaseUrl } from "@/lib/api";
import { STATUS_BADGE_MAP, ReportItem } from "@/lib/reportTypes";
import { Search, CheckCircle2, Clock, Building2, Mail, Printer, ArrowLeft, ChevronRight, MapPin, ShieldCheck, AlertCircle, RefreshCw, FileSearch } from "lucide-react";
import "./lacak.css";

type ReportStatus = ReportItem["status"] | "DUPLIKAT" | "DITUTUP";
interface LiveTrackResponse {
  id: string;
  ticketCode: string;
  status: ReportStatus;
  districtName: string;
  subdistrictName: string;
  assignedAgencyName: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  forwardedAt: string | null;
  resolvedAt: string | null;
  rejectionReason?: string | null;
  rejectionNote?: string | null;
  duplicateOfId?: string | null;
  photos?: { id: string; kind: string; publicUrl: string }[];
  draft: { sourceType: "AI" | "TEMPLATE"; permanentLabel: "✨ [Draf Dibantu AI]" | "📄 [Draf Template]"; title: string; body: string } | null;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi", TERVERIFIKASI: "Terverifikasi", DITERUSKAN: "Diteruskan ke instansi", DIPROSES: "Sedang diproses", SELESAI: "Selesai, dalam pemantauan 30 hari", DIBUKA_KEMBALI: "Dibuka kembali", DITOLAK: "Ditolak", DUPLIKAT: "Duplikat", DITUTUP: "Ditutup",
};
const formatTime = (value?: string | null) => value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }) + " WIB" : null;

export default function LacakTiketPage() {
  const [ticketInput, setTicketInput] = useState("");
  const [liveReport, setLiveReport] = useState<LiveTrackResponse | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "empty" | "not-found" | "error">("empty");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const urlKode = new URLSearchParams(window.location.search).get("kode");
    if (urlKode) setTicketInput(urlKode);
  }, []);

  useEffect(() => {
    const code = ticketInput.trim();
    let current = true;
    setLiveReport(null);
    if (!code) { setLoadState("empty"); return; }
    setLoadState("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<LiveTrackResponse>(`/track/${encodeURIComponent(code)}`);
        if (!current) return;
        if (res.success && res.data) { setLiveReport(res.data); setLoadState("ready"); }
        else setLoadState(res.error?.code === "TICKET_NOT_FOUND" ? "not-found" : "error");
      } catch {
        if (!current) return;
        setLoadState("error");
      }
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [ticketInput, refreshKey]);

  const activeStatus = liveReport?.status ?? "MENUNGGU_VERIFIKASI";
  const displayTitle = liveReport ? liveReport.draft?.title ?? "Laporan kerusakan jalan" : "";
  const displayAgency = liveReport ? liveReport.assignedAgencyName : null;
  const displayCode = liveReport?.ticketCode ?? ticketInput.trim();
  const district = liveReport?.districtName;
  const finalStatus = ["SELESAI", "DIBUKA_KEMBALI", "DITUTUP"].includes(activeStatus);
  const verified = !["MENUNGGU_VERIFIKASI", "DITOLAK", "DUPLIKAT"].includes(activeStatus);
  const forwarded = ["DITERUSKAN", "DIPROSES", "SELESAI", "DIBUKA_KEMBALI", "DITUTUP"].includes(activeStatus);
  const terminal = activeStatus === "DITOLAK" || activeStatus === "DUPLIKAT";
  const timeline = [
    { stage: "Laporan dikirim", actor: "Warga pelapor", desc: "Data laporan dan persetujuan draf diterima untuk diperiksa Admin.", time: liveReport ? formatTime(liveReport.submittedAt) : null, done: true },
    { stage: "Verifikasi Admin", actor: "Admin SIJAGO", desc: verified ? "Laporan terverifikasi dan dapat ditampilkan di peta publik." : terminal ? "Hasil pemeriksaan Admin tersedia pada status laporan." : "Admin memeriksa foto dan lokasi sebelum laporan tampil di peta publik.", time: formatTime(liveReport?.verifiedAt), done: verified },
    { stage: "Diteruskan ke instansi", actor: displayAgency || "Admin SIJAGO", desc: terminal ? "Laporan ini tidak diteruskan ke instansi. Lihat hasil pemeriksaan Admin pada status laporan." : forwarded ? "Laporan telah diteruskan ke instansi setelah konfirmasi Admin." : "Menunggu verifikasi dan penentuan instansi yang berwenang.", time: formatTime(liveReport?.forwardedAt), done: forwarded },
    { stage: "Perbaikan & pemantauan", actor: displayAgency || "Instansi terkait", desc: terminal ? "Tahap perbaikan tidak dilanjutkan untuk tiket ini." : finalStatus ? "Perbaikan memasuki masa pemantauan komunitas selama 30 hari." : activeStatus === "DIPROSES" ? "Instansi sedang menindaklanjuti laporan. Bukti perbaikan ditampilkan jika tersedia." : "Menunggu tindak lanjut dan bukti perbaikan dari instansi.", time: formatTime(liveReport?.resolvedAt), done: finalStatus },
  ];
  if (activeStatus === "DIBUKA_KEMBALI") timeline.push({ stage: "Laporan dibuka kembali", actor: "Admin SIJAGO", desc: "Laporan perlu ditinjau kembali setelah penilaian hasil perbaikan oleh komunitas.", time: null, done: true });
  if (activeStatus === "DITUTUP") timeline.push({ stage: "Pemantauan berakhir", actor: "SIJAGO", desc: "Masa pemantauan komunitas selesai dan laporan ditutup.", time: null, done: true });
  const photos = liveReport?.photos ?? [];

  return (
    <main className="tracking-page">
      <div className="tracking-container">
        <Link href="/" className="tracking-back"><ArrowLeft size={16} aria-hidden="true" />Kembali ke peta</Link>
        <header className="tracking-heading"><h1>Lacak laporan Anda</h1><p>Masukkan kode tiket untuk melihat perkembangan laporan. Tanpa perlu login.</p></header>

        <section className="tracking-search" aria-label="Cari laporan">
          <form onSubmit={(event) => { event.preventDefault(); setRefreshKey((value) => value + 1); }}>
            <label htmlFor="tracking-code">Kode tiket</label>
            <div className="tracking-search-row"><div className="tracking-input"><Search size={19} aria-hidden="true" /><input id="tracking-code" name="kode" type="text" value={ticketInput} onChange={(e) => setTicketInput(e.target.value)} placeholder="Masukkan kode tiket Anda" autoComplete="off" spellCheck={false} aria-describedby="tracking-help" /></div><button type="submit" className="tracking-primary" disabled={loadState === "loading" || !ticketInput.trim()}>{loadState === "loading" ? "Mencari…" : "Lacak laporan"}<Search size={17} aria-hidden="true" /></button></div>
            <p id="tracking-help">Kode tiket diberikan setelah laporan berhasil dikirim.</p>
          </form>
        </section>

        <SavedTickets onSelect={setTicketInput} />

        {loadState === "loading" && <div className="tracking-state" role="status"><RefreshCw size={24} aria-hidden="true" /><h2>Mencari laporan…</h2><p>Sedang mengambil perkembangan tiket Anda.</p></div>}
        {loadState === "empty" && <div className="tracking-state" role="status"><FileSearch size={28} aria-hidden="true" /><h2>Masukkan kode tiket Anda</h2><p>Lihat kode pada bukti pengiriman atau tautan pelacakan laporan.</p></div>}
        {loadState === "not-found" && <div className="tracking-state" role="status"><FileSearch size={28} aria-hidden="true" /><h2>Laporan tidak ditemukan</h2><p>Periksa kembali kode tiket. Pastikan semua huruf dan angka sesuai bukti pengiriman.</p></div>}
        {loadState === "error" && <div className="tracking-state tracking-error" role="alert"><AlertCircle size={28} aria-hidden="true" /><h2>Laporan belum dapat dimuat</h2><p>Periksa koneksi Anda atau coba lagi beberapa saat.</p><button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="tracking-secondary"><RefreshCw size={16} aria-hidden="true" />Coba lagi</button></div>}

        {loadState === "ready" && <div className="tracking-result" aria-label="Hasil pelacakan">
          <article className="tracking-summary">
            <div className="tracking-result-top"><p className="tracking-ticket">{displayCode}</p><span className={`tracking-status tracking-status-${activeStatus.toLowerCase()}`}>{STATUS_LABELS[activeStatus] ?? STATUS_BADGE_MAP.MENUNGGU_VERIFIKASI.label}</span></div>
            <h2>{displayTitle}</h2>
            <div className="tracking-report-meta"><p><MapPin size={15} aria-hidden="true" />{district || "Lokasi belum tersedia"}</p></div>
            <div className="tracking-summary-footer"><div className="tracking-data-source" role="status"><ShieldCheck size={16} aria-hidden="true" />Data laporan dari server</div><div className="tracking-actions"><a href={`${browserApiBaseUrl}/public/reports/${encodeURIComponent(displayCode)}/document`} target="_blank" rel="noopener noreferrer" className="tracking-secondary"><Printer size={16} aria-hidden="true" />Cetak / PDF lembar resmi</a><Link href={`/laporan/${displayCode}`} className="tracking-detail-link">Buka detail & sign-off<ChevronRight size={17} aria-hidden="true" /></Link></div></div>
            {terminal && <div className="tracking-terminal"><AlertCircle size={19} aria-hidden="true" /><div><strong>{STATUS_LABELS[activeStatus]}</strong><p>{liveReport?.rejectionNote || liveReport?.rejectionReason || (activeStatus === "DUPLIKAT" ? "Laporan ditandai sebagai duplikat. Periksa detail laporan untuk tindak lanjut." : "Laporan tidak lolos verifikasi. Periksa detail laporan untuk informasi lebih lanjut.")}</p></div></div>}
          </article>

          <div className="tracking-details-layout">
            <section className="tracking-timeline" aria-labelledby="timeline-heading"><h3 id="timeline-heading">Perjalanan laporan</h3><ol>{timeline.map((item, idx) => <li key={idx} className={item.done ? "is-done" : "is-pending"}><span className="tracking-timeline-icon">{item.done ? <CheckCircle2 size={20} aria-hidden="true" /> : <Clock size={20} aria-hidden="true" />}</span><div className="tracking-timeline-copy"><div className="tracking-timeline-heading"><h4>{item.stage}</h4><span>{item.time || (item.done ? "Waktu belum tersedia" : terminal ? "Tidak dilanjutkan" : "Menunggu pembaruan")}</span></div><p className="tracking-actor">{item.actor}</p><p>{item.desc}</p></div></li>)}</ol></section>
            <aside className="tracking-aside" aria-label="Informasi tindak lanjut">
              <section className="tracking-agency"><Building2 size={22} aria-hidden="true" /><h3>Instansi penanganan</h3><p>{displayAgency || "Belum ditentukan. Laporan masih ditinjau Admin SIJAGO."}</p><p className="tracking-helper">Jadwal perbaikan menjadi kewenangan instansi terkait.</p></section>

              <section className="tracking-email"><Mail size={20} aria-hidden="true" /><h3>Notifikasi email</h3><p>Hanya dikirim jika pelapor memberikan persetujuan eksplisit. Email tidak menjanjikan waktu perbaikan.</p><p className="tracking-helper">Untuk berhenti berlangganan, gunakan tautan di email notifikasi.</p></section>
            </aside>
          </div>
          {photos.length > 0 && <section className="tracking-evidence" aria-label="Foto laporan dan bukti perbaikan"><h3>Foto & bukti perbaikan</h3><div>{photos.map((photo, index) => <figure key={photo.id}><PhotoPreview photos={photos.map(item => ({ ...item, alt: item.kind === "AFTER" ? "Bukti setelah perbaikan jalan" : "Kondisi jalan yang dilaporkan" }))} index={index}><img src={photo.publicUrl} alt={photo.kind === "AFTER" ? "Bukti setelah perbaikan jalan" : "Kondisi jalan yang dilaporkan"} width={480} height={320} loading="lazy" /></PhotoPreview><figcaption>{photo.kind === "AFTER" ? "Sesudah perbaikan" : photo.kind === "SIGNOFF" ? "Penilaian komunitas" : "Sebelum perbaikan"}</figcaption></figure>)}</div></section>}
        </div>}
      </div>
    </main>
  );
}
