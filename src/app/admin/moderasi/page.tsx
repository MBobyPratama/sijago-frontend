"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { MOCK_REPORTS, ReportItem } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, EyeOff, GitMerge, Send, CheckCircle2, RefreshCw, X, MapPin, ShieldCheck, Search } from "lucide-react";
import "./moderasi.css";

const AGENCY_LABELS: Record<string, { name: string; email: string }> = {
  PUPR_KOTA_BOGOR: {
    name: "Dinas PUPR Kota Bogor (Jalan Kota)",
    email: "pupr.kotabogor@sijago.simulasi.id",
  },
  BINAMARGA_JABAR: {
    name: "Dinas Bina Marga Pemprov Jabar (Jalan Provinsi)",
    email: "binamarga.jabar@sijago.simulasi.id",
  },
  BBPJN_NASIONAL: {
    name: "BBPJN DKI Jakarta - Jawa Barat (Jalan Nasional)",
    email: "bbpjn.nasional@sijago.simulasi.id",
  },
};

type QueueReport = Omit<ReportItem, "status"> & {
  status: string;
  photos?: { id: string; kind: string; publicUrl: string; isBlurredByAdmin?: boolean }[];
  adminNotes?: string[];
  assignedAgencyCode?: string;
  returnedByAgency?: boolean;
  returnReason?: string;
};
const STATUS_LABELS: Record<string,string> = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi", TERVERIFIKASI: "Terverifikasi", DITERUSKAN: "Diteruskan", DIPROSES: "Diproses", SELESAI: "Selesai", DIBUKA_KEMBALI: "Dibuka kembali", DITOLAK: "Ditolak", DUPLIKAT: "Duplikat", DITUTUP: "Ditutup",
};
const cleanLabel = (text: string) => text.replace(/^[^\p{L}\p{N}\[]+/u, "");

export default function AdminModerasiPage() {
  const [reports, setReports] = useState<QueueReport[]>(MOCK_REPORTS);
  const [selectedId, setSelectedId] = useState(MOCK_REPORTS[2].id);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState("PUPR_KOTA_BOGOR");
  const [adminNote, setAdminNote] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [messageError, setMessageError] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [mergeMasterCode, setMergeMasterCode] = useState("SJG-2026-1042");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("PRIORITY");
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const liveRef = useRef(false);
  const requestVersion = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const selectedReport = reports.find((r) => r.id === selectedId);

  const fetchAdminQueue = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!busyRef.current) setLoading(true);
    setQueueError(null);
    try {
      const res = await apiFetch<QueueReport[]>("/admin/reports");
      if (version !== requestVersion.current) return;
      if (!res.success || !Array.isArray(res.data)) throw new Error(res.error?.detail || "Antrean belum dapat dimuat.");
      setReports(res.data);
      setIsLiveDb(true);
      liveRef.current = true;
      const waiting = res.data.find(r => r.status === "MENUNGGU_VERIFIKASI");
      setSelectedId(prev => res.data!.some(item => item.id === prev) ? prev : waiting?.id || res.data![0]?.id || "");
    } catch (error) {
      if (version !== requestVersion.current) return;
      setQueueError(error instanceof Error ? error.message : "Koneksi ke server terputus. Coba segarkan antrean.");
      // Retain existing data on refresh failure; never replace live reports with samples.
      if (!liveRef.current) setIsLiveDb(false);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => { fetchAdminQueue(); return () => { requestVersion.current++; }; }, [fetchAdminQueue]);
  useEffect(() => {
    setAdminNote(selectedReport?.adminNotes?.[0] || "");
    setIsBlurred(selectedReport?.photos?.some(photo => photo.isBlurredByAdmin) || false);
    setSelectedAgency(selectedReport?.assignedAgencyCode && AGENCY_LABELS[selectedReport.assignedAgencyCode] ? selectedReport.assignedAgencyCode : "PUPR_KOTA_BOGOR");
    setRejectReason("");
    setToastMsg(null);
  // Notes and routing are local to the selected report; refresh does not erase an unsaved note.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, isLiveDb]);

  useEffect(() => {
    if (!showEmailModal) return;
    const background = [...document.querySelectorAll<HTMLElement>("body > header, .moderation-container, body > footer")];
    background.forEach(el => el.setAttribute("inert", ""));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) setShowEmailModal(false);
      if (event.key !== "Tab") return;
      const fields = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled)");
      if (!fields?.length) return;
      const first = fields[0], last = fields[fields.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { background.forEach(el => el.removeAttribute("inert")); document.removeEventListener("keydown", onKey); dialogTrigger.current?.focus(); };
  }, [showEmailModal]);

  const filteredReports = useMemo(() => {
    const search = query.trim().toLowerCase();
    const items = reports.filter(rep => (statusFilter === "ALL" || rep.status === statusFilter) && `${rep.ticketCode} ${rep.title} ${rep.districtName}`.toLowerCase().includes(search));
    return sortOrder === "PRIORITY" ? [...items].sort((a,b) => b.priorityScore - a.priorityScore) : items;
  }, [reports,statusFilter,query,sortOrder]);
  const notify = (message: string, error = false) => { setToastMsg(message); setMessageError(error); };
  const runAction = async <T,>(action: string, endpoint: string, body: object, onSuccess: (data?: T) => void) => {
    if (!selectedReport || busyRef.current || loading) return;
    if (!isLiveDb) { notify("Mode contoh: tidak ada perubahan yang disimpan dan tidak ada email yang dikirim. Segarkan antrean untuk menghubungkan server.", true); return; }
    busyRef.current = true; setBusy(action); setToastMsg(null);
    try {
      const res = await apiFetch<T>(`/admin/reports/${encodeURIComponent(selectedReport.id)}/${endpoint}`, { method: "POST", body: JSON.stringify(body) });
      if (!res.success) throw new Error(res.error?.detail || "Tindakan belum berhasil. Coba kembali.");
      onSuccess(res.data);
      await fetchAdminQueue();
    } catch (error) { notify(error instanceof Error ? error.message : "Koneksi terputus. Tindakan belum dikonfirmasi server; periksa antrean sebelum mencoba kembali.", true); }
    finally { busyRef.current = false; setBusy(null); }
  };
  const handleVerifyReport = async () => runAction("verify", "verify", {adminNote}, () => notify(`Laporan ${selectedReport?.ticketCode} terverifikasi dan dapat tampil di peta publik.`));
  const handleMergeDuplicate = async () => {
    if (!selectedReport || !mergeMasterCode.trim()) { notify("Isi kode tiket induk terlebih dahulu.", true); return; }
    if (mergeMasterCode.trim().toUpperCase() === selectedReport.ticketCode.toUpperCase()) { notify("Tiket induk harus berbeda dari laporan yang dipilih.", true); return; }
    if (!window.confirm(`Gabungkan ${selectedReport.ticketCode} ke ${mergeMasterCode.trim()}? Dukungan dan tag akan dipindahkan ke laporan induk.`)) return;
    await runAction<{mergedIntoTicketCode:string;masterUpvotesCount:number}>("merge", "merge", {masterTicketCode:mergeMasterCode.trim()}, data => notify(`Laporan digabung ke ${data?.mergedIntoTicketCode || mergeMasterCode}. Dukungan induk: ${data?.masterUpvotesCount ?? "belum tersedia"}.`));
  };
  const handleRejectReport = async (reasonCode: string) => {
    setRejectReason(reasonCode);
    if (!reasonCode || !selectedReport) return;
    if (!window.confirm(`Tolak laporan ${selectedReport.ticketCode}? Alasan akan dapat dilihat pelapor.`)) return;
    await runAction("reject", "reject", {reasonCode,reasonDetail:`Ditolak oleh Admin dengan kode ${reasonCode}`}, () => notify(`Laporan ${selectedReport.ticketCode} ditolak. Alasan tersimpan pada laporan.`));
  };
  const handleToggleBlur = async () => {
    const nextBlur = !isBlurred;
    await runAction<{isBlurredByAdmin:boolean}>("blur", "blur-photo", {blurred:nextBlur}, data => { setIsBlurred(data?.isBlurredByAdmin ?? nextBlur); notify(nextBlur ? "Blur privasi foto publik diaktifkan oleh server." : "Blur foto publik dinonaktifkan oleh server."); });
  };
  const handleEscalateEmail = async () => runAction<{status:string;agencyName:string;sentViaResend:boolean;messageId:string}>("escalate", "escalate", {agencyCode:selectedAgency,adminNote}, data => {
    if (!data) throw new Error("Server belum mengembalikan hasil pengiriman. Periksa antrean sebelum mencoba kembali.");
    notify(data.sentViaResend ? `Email dikirim ke ${data.agencyName}. ID: ${data.messageId}.` : `Server menjalankan simulasi pengiriman ke ${data.agencyName}. Email asli tidak dikirim. ID: ${data.messageId}.`);
    setShowEmailModal(false);
  });
  const photos = selectedReport?.photos?.filter(photo => photo.kind === "REPORT" || photo.kind === "BEFORE") || [];
  const disabled = Boolean(busy) || loading;

  return (
    <main className="moderation-page">
      <div className="moderation-container">
        <header className="moderation-heading"><div><h1>Moderasi laporan</h1><p>Periksa laporan warga sebelum dipublikasikan dan diteruskan ke instansi.</p></div><button type="button" onClick={fetchAdminQueue} disabled={disabled} className="mod-button"><RefreshCw size={16} aria-hidden="true" />{loading ? "Memuat antrean…" : "Segarkan antrean"}</button></header>
        <div className="mod-context"><span role="status" className={isLiveDb && !queueError?"mod-source-live":"mod-source-demo"}>{queueError && isLiveDb ? "Data terakhir, koneksi gagal" : isLiveDb?"Terhubung ke server":"Data contoh"}</span><span>Target verifikasi ≤ 2 hari kerja</span><span><ShieldCheck size={16} aria-hidden="true" />Fakta Asal warga tidak dapat diubah admin.</span></div>
        {queueError && <div role="alert" className="mod-notice mod-warning"><AlertTriangle size={18} aria-hidden="true" /><p>{queueError} {isLiveDb ? "Data terakhir tetap ditampilkan. Segarkan untuk mencoba kembali." : "Menampilkan contoh laporan; tindakan tidak disimpan."}</p></div>}
        {toastMsg && <div role={messageError?"alert":"status"} className={`mod-notice ${messageError?"mod-error":"mod-success"}`}><p>{toastMsg}</p><button type="button" onClick={() => setToastMsg(null)} className="mod-dismiss">Tutup</button></div>}

        <div className="mod-workspace">
          <section className="mod-queue" aria-labelledby="queue-heading" aria-busy={loading}>
            <div className="mod-queue-heading"><h2 id="queue-heading">Antrean laporan <span>{reports.length}</span></h2><p>Pilih laporan untuk memulai pemeriksaan.</p></div>
            <div className="mod-filters"><div className="mod-field mod-search"><label htmlFor="queue-search">Cari laporan</label><div><Search size={16} aria-hidden="true" /><input id="queue-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kode tiket, judul, kecamatan" /></div></div><div className="mod-filter-row"><div className="mod-field"><label htmlFor="queue-status">Status</label><select id="queue-status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="ALL">Semua status</option>{Object.entries(STATUS_LABELS).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></div><div className="mod-field"><label htmlFor="queue-sort">Urutan</label><select id="queue-sort" value={sortOrder} onChange={e=>setSortOrder(e.target.value)}><option value="PRIORITY">Prioritas tertinggi</option><option value="SERVER">Urutan server</option></select></div></div></div>
            <div className="mod-queue-list">{loading ? <div className="mod-loading" role="status"><span className="mod-skeleton" /><span className="mod-skeleton" /><span className="mod-skeleton" /><p>Memuat antrean laporan…</p></div> : filteredReports.length ? filteredReports.map(rep=><button key={rep.id} type="button" disabled={Boolean(busy)} onClick={() => { setSelectedId(rep.id); if (window.matchMedia("(max-width: 760px)").matches) requestAnimationFrame(() => { const heading = document.getElementById("inspection-heading"); heading?.focus({preventScroll:true}); heading?.scrollIntoView({block:"start",behavior:"instant"}); }); }} aria-pressed={rep.id===selectedId} className="mod-report-row"><span className="mod-report-code">{rep.ticketCode}</span><span className={`mod-status mod-status-${rep.status}`}>{STATUS_LABELS[rep.status] || rep.status}</span><strong>{rep.title}</strong><span className="mod-report-meta"><span>{rep.districtName}</span><span>Skor {rep.priorityScore}</span></span>{rep.exifMismatchFlag && <span className="mod-row-warning"><AlertTriangle size={14} aria-hidden="true" />Selisih EXIF &gt;100 m</span>}{rep.returnedByAgency && <span className="mod-row-warning">Dikembalikan instansi</span>}</button>) : <div className="mod-empty"><h3>{reports.length?"Tidak ada hasil yang cocok":"Antrean kosong"}</h3><p>{reports.length?"Coba kata kunci atau status lain.":"Belum ada laporan untuk diperiksa."}</p>{reports.length>0 && <button type="button" className="mod-button" onClick={()=>{setQuery("");setStatusFilter("ALL");}}>Reset filter</button>}</div>}</div>
          </section>

          <section className="mod-inspection" aria-label="Pemeriksaan laporan" aria-busy={loading}>
            {loading ? <div className="mod-loading"><span className="mod-skeleton" /><span className="mod-skeleton" /><p>Menyiapkan detail pemeriksaan…</p></div> : !selectedReport ? <div className="mod-empty"><h2>Pilih laporan untuk diperiksa</h2><p>Detail dan tindakan moderasi akan muncul di sini.</p></div> : <>
              <header className="mod-detail-heading"><a href="#queue-heading" className="mod-back-queue">Kembali ke antrean</a><div className="mod-detail-meta"><span>{selectedReport.ticketCode}</span><span className={`mod-status mod-status-${selectedReport.status}`} role="status">{STATUS_LABELS[selectedReport.status] || selectedReport.status}</span></div><h2 id="inspection-heading" tabIndex={-1}>{selectedReport.title}</h2><span className="mod-draft">{cleanLabel(selectedReport.permanentLabel)}</span></header>
              {selectedReport.returnedByAgency && <div className="mod-notice mod-warning"><p><strong>Dikembalikan instansi.</strong> {selectedReport.returnReason || "Periksa kembali kewenangan dan tujuan penerusan."}</p></div>}
              <details className="mod-section mod-facts-disclosure"><summary>Fakta laporan dan draf</summary><p>{selectedReport.body}</p><dl className="mod-facts"><div><dt>Lokasi</dt><dd>{selectedReport.districtName}, {selectedReport.subdistrictName}</dd></div><div><dt>Kategori & ukuran</dt><dd>{selectedReport.category.replaceAll("_"," ").toLowerCase()} ({selectedReport.dimensionsCm})</dd></div><div><dt>Koordinat</dt><dd>{selectedReport.lat}, {selectedReport.lng}</dd></div><div><dt>Dukungan warga</dt><dd>{selectedReport.upvotes}</dd></div></dl></details>
              <section className="mod-section" aria-labelledby="evidence-heading"><h3 id="evidence-heading">Bukti foto dan lokasi</h3><div className="mod-evidence"><figure><figcaption>Foto yang tersedia dari laporan</figcaption>{photos.length ? photos.map(photo=><a key={photo.id} href={photo.publicUrl} target="_blank" rel="noopener noreferrer"><img src={photo.publicUrl} alt="Bukti kondisi jalan yang dilaporkan" /></a>) : <p className="mod-photo-empty">Belum ada foto yang dapat ditampilkan.</p>}<button type="button" onClick={handleToggleBlur} disabled={disabled} aria-pressed={isBlurred} className="mod-button"><EyeOff size={16} aria-hidden="true" />{busy==="blur"?"Memproses…":isBlurred?"Nonaktifkan blur publik":"Aktifkan blur publik"}</button><p className="mod-helper">Foto asli tetap terbatas untuk admin. Tampilan ini memakai URL foto yang disediakan API.</p></figure><div><dl className="mod-location-facts"><div><dt>Sumber titik</dt><dd>{selectedReport.locationSource} (±{selectedReport.gpsAccuracyMeters} m)</dd></div><div><dt>Selisih GPS dan EXIF</dt><dd>{selectedReport.exifDistanceMeters} meter</dd></div><div><dt>Patokan warga</dt><dd>{selectedReport.landmark}</dd></div></dl><div className={`mod-location-check ${selectedReport.exifMismatchFlag?"mod-warning":"mod-success"}`}><AlertTriangle size={16} aria-hidden="true" /><p>{selectedReport.exifMismatchFlag?"Jarak EXIF foto lebih dari 100 m dari pin laporan. Periksa kesesuaian patokan sebelum verifikasi.":"Lokasi EXIF foto konsisten dengan titik GPS laporan."}</p></div></div></div></section>
              <section className="mod-section" aria-labelledby="decision-heading"><div className="mod-decision-heading"><h3 id="decision-heading">Catatan dan keputusan</h3><button type="button" onClick={handleVerifyReport} disabled={disabled} className="mod-button mod-primary"><CheckCircle2 size={17} aria-hidden="true" />{busy==="verify"?"Memverifikasi…":"Verifikasi laporan"}</button></div><div className="mod-field"><label htmlFor="admin-note">Catatan koreksi admin</label><textarea id="admin-note" rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} disabled={disabled} aria-describedby="admin-note-help" /><p id="admin-note-help" className="mod-helper">Disimpan terpisah di admin_notes, tanpa mengubah Fakta Asal warga (BRL-08).</p></div><div className="mod-secondary-actions"><div className="mod-field"><label htmlFor="merge-master">Kode tiket induk</label><div className="mod-inline-control"><input id="merge-master" type="text" value={mergeMasterCode} onChange={(e) => setMergeMasterCode(e.target.value)} title="Kode Tiket Induk" disabled={disabled} /><button type="button" onClick={handleMergeDuplicate} disabled={disabled} className="mod-button"><GitMerge size={16} aria-hidden="true" />Gabung</button></div></div><div className="mod-field"><label htmlFor="reject-reason">Alasan penolakan (wajib)</label><select id="reject-reason" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} disabled={disabled}><option value="">Pilih alasan</option><option value="SPAM">Spam / Foto Tidak Relevan</option><option value="PII_SARA">Memuat Tuduhan / PII Pihak Lain</option><option value="OUTSIDE_SCOPE">Bukan Infrastruktur Jalan</option></select><button type="button" className="mod-button mod-danger" disabled={disabled || !rejectReason} onClick={()=>handleRejectReport(rejectReason)}>Tolak laporan</button></div></div></section>
              <section className="mod-section mod-routing" aria-labelledby="routing-heading"><h3 id="routing-heading">Teruskan ke instansi</h3><p>Petunjuk ruas: Jalan Kota. Keputusan tujuan tetap pada admin.</p><div className="mod-field"><label htmlFor="selected-agency">Instansi berwenang</label><select id="selected-agency" value={selectedAgency} onChange={(e) => setSelectedAgency(e.target.value)} disabled={disabled}>{Object.entries(AGENCY_LABELS).map(([code,agency])=><option value={code} key={code}>{agency.name}</option>)}</select></div><button type="button" onClick={() => { dialogTrigger.current = document.activeElement as HTMLElement; setShowEmailModal(true); }} disabled={disabled} className="mod-button"><Send size={16} aria-hidden="true" />Pratinjau email</button><p className="mod-helper">Email resmi dikirim hanya setelah konfirmasi admin pada pratinjau.</p></section>
            </>}
          </section>
        </div>
      </div>
      {showEmailModal && selectedReport && <div className="mod-modal-overlay"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="email-heading" className="mod-modal"><div className="mod-modal-heading"><h2 id="email-heading">Pratinjau email ke instansi</h2><button type="button" autoFocus onClick={() => setShowEmailModal(false)} disabled={Boolean(busy)} className="mod-close" aria-label="Tutup pratinjau"><X size={20} aria-hidden="true" /></button></div><dl className="mod-email-meta"><div><dt>Penerima resmi</dt><dd>{AGENCY_LABELS[selectedAgency].name}<br />{AGENCY_LABELS[selectedAgency].email}</dd></div><div><dt>Subjek</dt><dd>[ESKALASI SIJAGO {selectedReport.ticketCode}] {selectedReport.title}</dd></div></dl><div className="mod-email-body"><span className="mod-draft">Label sumber teks: {cleanLabel(selectedReport.permanentLabel)}</span><p>{selectedReport.body}</p><p>Koordinat: {selectedReport.lat}, {selectedReport.lng} ({selectedReport.districtName})</p><p>Catatan admin: {adminNote || "Tidak ada catatan tambahan."}</p><p>Privasi Pelapor: Identitas pelapor disembunyikan sesuai aturan BRL-14.</p></div><p className="mod-notice mod-warning"><strong>Konfirmasi Kendali Manusia (BRL-06):</strong> Dengan menekan tombol di bawah, sistem akan mengirim email melalui Resend dan mencatat aksi atas nama akun Admin Anda di <code>report_audit_logs</code>. Jika server memakai mode simulasi, email asli tidak dikirim; hasil pengiriman akan ditandai setelah konfirmasi.</p>{toastMsg && messageError && <p role="alert" className="mod-notice mod-error">{toastMsg}</p>}<div className="mod-modal-actions"><button type="button" onClick={() => setShowEmailModal(false)} disabled={Boolean(busy)} className="mod-button">Batal</button><button type="button" onClick={handleEscalateEmail} disabled={Boolean(busy)} className="mod-button mod-primary"><Send size={16} aria-hidden="true" />{busy==="escalate"?"Mengirim email…":"Konfirmasi & kirim"}</button></div></div></div>}
    </main>
  );
}
