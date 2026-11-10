"use client";

import { ReportDescription } from "@/components/ReportDescription";

import { PhotoPreview } from "@/components/PhotoPreview";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ReportTicketPicker, type TicketOption } from "@/components/ReportTicketPicker";
import { ReportItem } from "@/lib/reportTypes";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, EyeOff, GitMerge, Send, CheckCircle2, RefreshCw, X, MapPin, ShieldCheck, Search } from "lucide-react";
import "./moderasi.css";

type AgencyOption = { code: string; name: string; officialEmails: string[] };
type ForwardResult = { status: string; agencyName?: string; deliveryStatus?: string; failureReason?: string | null; assignmentFailed?: boolean; assignmentError?: string };

type QueueReport = Omit<ReportItem, "status"> & {
  status: string;
  photos?: { id: string; kind: string; publicUrl: string; isBlurredByAdmin?: boolean }[];
  adminNotes?: string[];
  escalationEmail?: { id: string; deliveryStatus: string; failureReason: string | null; canRetry: boolean } | null;
  assignedAgencyCode?: string;
  returnedByAgency?: boolean;
  canCancelVerification?: boolean;
  returnReason?: string;
};
const STATUS_LABELS: Record<string,string> = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi", TERVERIFIKASI: "Terverifikasi", DITERUSKAN: "Diteruskan", DIPROSES: "Diproses", SELESAI: "Selesai", DIBUKA_KEMBALI: "Dibuka kembali", DITOLAK: "Ditolak", DUPLIKAT: "Duplikat", DITUTUP: "Ditutup",
};
const REJECT_LABELS: Record<string, string> = { SPAM: "Spam / foto tidak relevan", PII_SARA: "Memuat tuduhan / data pribadi pihak lain", OUTSIDE_SCOPE: "Bukan infrastruktur jalan" };
const cleanLabel = (text: string) => text.replace(/^[^\p{L}\p{N}\[]+/u, "");

export default function AdminModerasiPage() {
  const [reports, setReports] = useState<QueueReport[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [agencyOptions, setAgencyOptions] = useState<AgencyOption[]>([]);
  const [agencyError, setAgencyError] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [publicResponse, setPublicResponse] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const cancelDialog = useRef<HTMLDialogElement>(null);
  const cancelTrigger = useRef<HTMLButtonElement>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [messageError, setMessageError] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const rejectDialog = useRef<HTMLDialogElement>(null);
  const rejectTrigger = useRef<HTMLButtonElement>(null);
  const [mergeMasterCode, setMergeMasterCode] = useState("");
  const [showMergeModal, setShowMergeModal] = useState(false);
  const mergeDialog = useRef<HTMLDialogElement>(null);
  const mergeTrigger = useRef<HTMLButtonElement>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("PRIORITY");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [allMergeCandidates, setAllMergeCandidates] = useState<TicketOption[]>([]);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const liveRef = useRef(false);
  const requestVersion = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const selectedReport = reports.find((r) => r.id === selectedId);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearchQuery(query.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchAdminQueue = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!busyRef.current) setLoading(true);
    setQueueError(null);
    try {
      const params = new URLSearchParams({ page: String(page), query: searchQuery, status: statusFilter, sort: sortOrder });
      const res = await apiFetch<{ items: QueueReport[]; pagination: typeof pagination }>(`/admin/reports?${params}`);
      if (version !== requestVersion.current) return;
      if (!res.success || !res.data || !Array.isArray(res.data.items)) throw new Error(res.error?.detail || "Antrean belum dapat dimuat.");
      const items = res.data.items;
      setReports(items);
      setPagination(res.data.pagination);
      setIsLiveDb(true);
      liveRef.current = true;
      const waiting = items.find(r => r.status === "MENUNGGU_VERIFIKASI");
      setSelectedId(prev => items.some(item => item.id === prev) ? prev : waiting?.id || items[0]?.id || "");
      const [mergeRes, agencyRes] = await Promise.all([apiFetch<TicketOption[]>("/admin/reports/merge-candidates").catch(() => null), apiFetch<AgencyOption[]>("/admin/agencies").catch(() => null)]);
      if (version !== requestVersion.current) return;
      if (agencyRes?.success && Array.isArray(agencyRes.data)) {
        const choices = agencyRes.data; setAgencyOptions(choices); setAgencyError(choices.length ? null : "Belum ada instansi aktif.");
        setSelectedAgency(prev => choices.some(item => item.code === prev) ? prev : choices[0]?.code || "");
      } else { setAgencyOptions([]); setAgencyError("Daftar instansi belum dapat dimuat. Segarkan antrean untuk mencoba lagi."); }
      if (mergeRes?.success && Array.isArray(mergeRes.data)) { setAllMergeCandidates(mergeRes.data); setMergeError(null); }
      else { setAllMergeCandidates([]); setMergeError("Daftar tiket induk belum dapat dimuat. Segarkan antrean untuk mencoba lagi."); }
    } catch (error) {
      if (version !== requestVersion.current) return;
      setQueueError(error instanceof Error ? error.message : "Koneksi ke server terputus. Coba segarkan antrean.");
      // Retain existing data on refresh failure; never replace live reports with samples.
      if (!liveRef.current) setIsLiveDb(false);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [page, searchQuery, statusFilter, sortOrder]);
  useEffect(() => { fetchAdminQueue(); return () => { requestVersion.current++; }; }, [fetchAdminQueue]);
  useEffect(() => {
    setAdminNote(selectedReport?.adminNotes?.[0] || "");
    setPublicResponse(selectedReport?.publicAdminResponse || "");
    setIsBlurred(selectedReport?.photos?.some(photo => photo.isBlurredByAdmin) || false);
    setSelectedAgency(selectedReport?.assignedAgencyCode || agencyOptions[0]?.code || "");
    setShowEmailModal(false);
    cancelDialog.current?.close();
    setShowRejectModal(false);
    setCancelReason("");
    setCancelError(null);
    setRejectReason("");
    setMergeMasterCode("");
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

  useEffect(() => {
    if (!showRejectModal) return;
    const dialog = rejectDialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => { document.body.style.overflow = previousOverflow; dialog?.close(); rejectTrigger.current?.focus(); };
  }, [showRejectModal]);

  useEffect(() => {
    if (!showMergeModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mergeDialog.current?.showModal();
    return () => { document.body.style.overflow = previousOverflow; mergeDialog.current?.close(); mergeTrigger.current?.focus(); };
  }, [showMergeModal]);

  const filteredReports = reports;
  const hasQueueFilters = Boolean(query.trim()) || statusFilter !== "ALL";
  const notify = (message: string, error = false) => { setToastMsg(message); setMessageError(error); };
  const runAction = async <T,>(action: string, endpoint: string, body: object, onSuccess: (data?: T) => void, method = "POST") => {
    if (!selectedReport || busyRef.current || loading) return;
    if (!isLiveDb) { notify("Server belum terhubung. Segarkan antrean sebelum melakukan tindakan.", true); return; }
    busyRef.current = true; setBusy(action); setToastMsg(null);
    try {
      const res = await apiFetch<T>(`/admin/reports/${encodeURIComponent(selectedReport.id)}/${endpoint}`, { method, body: JSON.stringify(body) });
      if (!res.success) throw new Error(res.error?.detail || "Tindakan belum berhasil. Coba kembali.");
      onSuccess(res.data);
      await fetchAdminQueue();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Koneksi terputus. Tindakan belum dikonfirmasi server; periksa antrean sebelum mencoba kembali.";
      await fetchAdminQueue();
      notify(message, true);
    }
    finally { busyRef.current = false; setBusy(null); }
  };
  const handleVerifyReport = async () => runAction("verify", "verify", {adminNote}, () => notify(`Laporan ${selectedReport?.ticketCode} terverifikasi dan dapat tampil di peta publik.`));
  const handleCancelVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancelReason.trim()) { setCancelError("Isi alasan pembatalan verifikasi."); return; }
    await runAction("cancel-verification", "cancel-verification", { reason: cancelReason.trim() }, () => {
      cancelDialog.current?.close();
      setCancelReason("");
      notify("Verifikasi dibatalkan. Laporan kembali menunggu verifikasi dan tidak ditampilkan di peta publik.");
    });
  };
  const mergeCandidates = allMergeCandidates.filter(report => report.id !== selectedId);
  const handleMergeDuplicate = async () => {
    if (!selectedReport || !mergeCandidates.some(report => report.ticketCode === mergeMasterCode)) { notify("Pilih tiket induk dari daftar terlebih dahulu.", true); return; }
    if (mergeMasterCode.trim().toUpperCase() === selectedReport.ticketCode.toUpperCase()) { notify("Tiket induk harus berbeda dari laporan yang dipilih.", true); return; }
    if (!showMergeModal) return;
    await runAction<{mergedIntoTicketCode:string;masterUpvotesCount:number}>("merge", "merge", {masterTicketCode:mergeMasterCode.trim()}, data => { setShowMergeModal(false); notify(`Laporan digabung ke ${data?.mergedIntoTicketCode || mergeMasterCode}. Dukungan induk: ${data?.masterUpvotesCount ?? "belum tersedia"}.`); });
  };
  const handleRejectReport = async (reasonCode: string) => {
    if (!REJECT_LABELS[reasonCode] || !selectedReport) return;
    await runAction("reject", "reject", {reasonCode,reasonDetail:`Ditolak oleh Admin dengan kode ${reasonCode}`}, () => {
      setShowRejectModal(false);
      notify(`Laporan ${selectedReport.ticketCode} ditolak. Alasan tersimpan pada laporan.`);
    });
  };
  const handleToggleBlur = async () => {
    const nextBlur = !isBlurred;
    await runAction<{isBlurredByAdmin:boolean}>("blur", "blur-photo", {blurred:nextBlur}, data => { setIsBlurred(data?.isBlurredByAdmin ?? nextBlur); notify(nextBlur ? "Blur privasi foto publik diaktifkan oleh server." : "Blur foto publik dinonaktifkan oleh server."); });
  };
  const forwardingMessage = (data?: ForwardResult) => {
    if (!data) throw new Error("Server belum mengembalikan hasil. Segarkan antrean sebelum mencoba lagi.");
    if (data.assignmentFailed) { notify("Laporan " + selectedReport?.ticketCode + " sudah diverifikasi, tetapi penugasan belum berhasil. " + (data.assignmentError || "Coba teruskan kembali tanpa verifikasi ulang."), true); return; }
    const sent = ["SENT", "DELIVERED"].includes(data.deliveryStatus || "");
    notify("Laporan " + selectedReport?.ticketCode + " ditugaskan ke " + (data.agencyName || "instansi") + ". " + (sent ? "Email berhasil dikirim." : data.deliveryStatus === "QUEUED" ? "Email masih diproses; segarkan antrean untuk memeriksa hasilnya." : "Email belum terkirim. Gunakan Kirim ulang email tanpa mengulangi verifikasi atau penugasan."), !sent);
  };
  const handleEscalateEmail = async () => runAction<ForwardResult>("escalate", selectedReport?.status === "MENUNGGU_VERIFIKASI" ? "verify-and-forward" : "escalate", { agencyCode: selectedAgency, adminNote }, data => { setShowEmailModal(false); forwardingMessage(data); });
  const handleRetryEmail = async () => runAction<ForwardResult>("retry-email", "retry-escalation-email", { escalationId: selectedReport?.escalationEmail?.id }, forwardingMessage);
  const selectedAgencyInfo = agencyOptions.find(item => item.code === selectedAgency);
  const canForward = selectedReport && ["MENUNGGU_VERIFIKASI", "TERVERIFIKASI", "DIBUKA_KEMBALI"].includes(selectedReport.status);
  const photos = selectedReport?.photos?.filter(photo => photo.kind === "REPORT" || photo.kind === "BEFORE") || [];
  const disabled = Boolean(busy) || loading;

  return (
    <main className="moderation-page">
      <div className="moderation-container">
        <header className="moderation-heading"><div><h1>Moderasi laporan</h1><p>Periksa laporan warga sebelum dipublikasikan dan diteruskan ke instansi.</p></div><button type="button" onClick={fetchAdminQueue} disabled={disabled} className="mod-button"><RefreshCw size={16} aria-hidden="true" />{loading ? "Memuat antrean…" : "Segarkan antrean"}</button></header>
        <div className="mod-context"><span role="status" className={isLiveDb && !queueError?"mod-source-live":"mod-source-demo"}>{queueError && isLiveDb ? "Data terakhir, koneksi gagal" : isLiveDb?"Terhubung ke server":"Belum terhubung"}</span><span>Target verifikasi ≤ 2 hari kerja</span><span><ShieldCheck size={16} aria-hidden="true" />Fakta Asal warga tidak dapat diubah admin.</span></div>
        {queueError && <div role="alert" className="mod-notice mod-warning"><AlertTriangle size={18} aria-hidden="true" /><p>{queueError} {isLiveDb ? "Data terakhir tetap ditampilkan. Segarkan untuk mencoba kembali." : "Antrean belum dapat dimuat."}</p></div>}
        {toastMsg && <div role={messageError?"alert":"status"} className={`mod-notice ${messageError?"mod-error":"mod-success"}`}><p>{toastMsg}</p><button type="button" onClick={() => setToastMsg(null)} className="mod-dismiss">Tutup</button></div>}

        <div className="mod-workspace">
          <section className="mod-queue" aria-labelledby="queue-heading" aria-busy={loading}>
            <div className="mod-queue-heading"><h2 id="queue-heading">Antrean laporan <span>{pagination.total}</span></h2><p>Pilih laporan untuk memulai pemeriksaan.</p></div>
            <div className="mod-filters"><div className="mod-field mod-search"><label htmlFor="queue-search">Cari laporan</label><div><Search size={16} aria-hidden="true" /><input id="queue-search" maxLength={200} disabled={Boolean(busy)} type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="Kode tiket, judul, kecamatan" /></div></div><div className="mod-filter-row"><div className="mod-field"><label htmlFor="queue-status">Status</label><select id="queue-status" disabled={Boolean(busy)} value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}><option value="ALL">Semua status</option>{Object.entries(STATUS_LABELS).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></div><div className="mod-field"><label htmlFor="queue-sort">Urutan</label><select id="queue-sort" disabled={Boolean(busy)} value={sortOrder} onChange={e=>{setSortOrder(e.target.value);setPage(1);}}><option value="PRIORITY">Prioritas tertinggi</option><option value="NEWEST">Terbaru</option></select></div></div></div>
            <div className="mod-queue-list">{loading ? <div className="mod-loading" role="status"><span className="mod-skeleton" /><span className="mod-skeleton" /><span className="mod-skeleton" /><p>Memuat antrean laporan…</p></div> : filteredReports.length ? filteredReports.map(rep=><button key={rep.id} type="button" disabled={Boolean(busy)} onClick={() => { setSelectedId(rep.id); if (window.matchMedia("(max-width: 760px)").matches) requestAnimationFrame(() => { const heading = document.getElementById("inspection-heading"); heading?.focus({preventScroll:true}); heading?.scrollIntoView({block:"start",behavior:"instant"}); }); }} aria-pressed={rep.id===selectedId} className="mod-report-row"><span className="mod-report-code">{rep.ticketCode}</span><span className={`mod-status mod-status-${rep.status}`}>{STATUS_LABELS[rep.status] || rep.status}</span><strong>{rep.title}</strong><span className="mod-report-meta"><span>{rep.districtName}</span><span>Skor {rep.priorityScore}</span></span>{rep.exifMismatchFlag && <span className="mod-row-warning"><AlertTriangle size={14} aria-hidden="true" />Selisih EXIF &gt;100 m</span>}{rep.returnedByAgency && <span className="mod-row-warning">Dikembalikan instansi</span>}</button>) : <div className="mod-empty"><h3>{hasQueueFilters?"Tidak ada hasil yang cocok":"Antrean kosong"}</h3><p>{hasQueueFilters?"Coba kata kunci atau status lain.":"Belum ada laporan untuk diperiksa."}</p>{hasQueueFilters && <button type="button" className="mod-button" onClick={()=>{setQuery("");setStatusFilter("ALL");setPage(1);}}>Reset filter</button>}</div>}</div>
          <nav className="mod-pagination" aria-label="Halaman antrean laporan"><p role="status">{pagination.total ? <>Menampilkan {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} dari {pagination.total} laporan</> : "Tidak ada laporan yang cocok"}</p><div><button type="button" className="mod-button" disabled={loading || Boolean(busy) || pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>Sebelumnya</button><span>Halaman {pagination.page} / {pagination.totalPages}</span><button type="button" className="mod-button" disabled={loading || Boolean(busy) || pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>Berikutnya</button></div></nav>
          </section>

          <section className="mod-inspection" aria-label="Pemeriksaan laporan" aria-busy={loading}>
            {loading ? <div className="mod-loading"><span className="mod-skeleton" /><span className="mod-skeleton" /><p>Menyiapkan detail pemeriksaan…</p></div> : !selectedReport ? <div className="mod-empty"><h2>Pilih laporan untuk diperiksa</h2><p>Detail dan tindakan moderasi akan muncul di sini.</p></div> : <>
              <header className="mod-detail-heading"><a href="#queue-heading" className="mod-back-queue">Kembali ke antrean</a><div className="mod-detail-meta"><span>{selectedReport.ticketCode}</span><span className={`mod-status mod-status-${selectedReport.status}`} role="status">{STATUS_LABELS[selectedReport.status] || selectedReport.status}</span></div><h2 id="inspection-heading" tabIndex={-1}>{selectedReport.title}</h2>{selectedReport.draftSource === "AI" && <span className="mod-draft">{cleanLabel(selectedReport.permanentLabel)}</span>}</header>
              {selectedReport.returnedByAgency && <div className="mod-notice mod-warning"><p><strong>Dikembalikan instansi.</strong> {selectedReport.returnReason || "Periksa kembali kewenangan dan tujuan penerusan."}</p></div>}
              <details className="mod-section mod-facts-disclosure"><summary>Fakta laporan dan draf</summary><ReportDescription description={selectedReport.description} fallbackBody={selectedReport.body} /><dl className="mod-facts"><div><dt>Lokasi</dt><dd>{selectedReport.districtName}, {selectedReport.subdistrictName}</dd></div><div><dt>Kategori & ukuran</dt><dd>{selectedReport.category.replaceAll("_"," ").toLowerCase()} ({selectedReport.dimensionsCm})</dd></div><div><dt>Koordinat</dt><dd>{selectedReport.lat}, {selectedReport.lng}</dd></div><div><dt>Dukungan warga</dt><dd>{selectedReport.upvotes}</dd></div></dl></details>
              <section className="mod-section" aria-labelledby="evidence-heading"><h3 id="evidence-heading">Bukti foto dan lokasi</h3><div className="mod-evidence"><figure><figcaption>Foto yang tersedia dari laporan</figcaption>{photos.length ? photos.map((photo, index)=><PhotoPreview key={photo.id} photos={photos} index={index}><img src={photo.publicUrl} alt="Bukti kondisi jalan yang dilaporkan" /></PhotoPreview>) : <p className="mod-photo-empty">Belum ada foto yang dapat ditampilkan.</p>}<button type="button" onClick={handleToggleBlur} disabled={disabled} aria-pressed={isBlurred} className="mod-button"><EyeOff size={16} aria-hidden="true" />{busy==="blur"?"Memproses…":isBlurred?"Nonaktifkan blur publik":"Aktifkan blur publik"}</button><p className="mod-helper">Foto asli tetap terbatas untuk admin. Tampilan ini memakai URL foto yang disediakan API.</p></figure><div><dl className="mod-location-facts"><div><dt>Sumber titik</dt><dd>{selectedReport.locationSource}{selectedReport.gpsAccuracyMeters != null ? ` (±${selectedReport.gpsAccuracyMeters} m)` : ""}</dd></div><div><dt>Selisih GPS dan EXIF</dt><dd>{selectedReport.exifDistanceMeters != null ? `${selectedReport.exifDistanceMeters} meter` : "Metadata EXIF tidak tersedia"}</dd></div><div><dt>Patokan warga</dt><dd>{selectedReport.landmark}</dd></div></dl><div className={`mod-location-check ${selectedReport.exifMismatchFlag?"mod-warning":"mod-success"}`}><AlertTriangle size={16} aria-hidden="true" /><p>{selectedReport.exifDistanceMeters == null ? "Kesesuaian EXIF belum dapat diperiksa karena metadata tidak tersedia." : selectedReport.exifMismatchFlag?"Jarak EXIF foto lebih dari 100 m dari pin laporan. Periksa kesesuaian patokan sebelum verifikasi.":"Lokasi EXIF foto konsisten dengan titik GPS laporan."}</p></div></div></div></section>
              <section className="mod-section" aria-labelledby="public-response-heading"><h3 id="public-response-heading">Tanggapan admin untuk warga</h3><div className="mod-field"><label htmlFor="public-response">Tanggapan publik (opsional)</label><textarea id="public-response" rows={3} maxLength={2000} value={publicResponse} onChange={e => setPublicResponse(e.target.value)} disabled={disabled} aria-describedby="public-response-help" /><p id="public-response-help" className="mod-helper">Teks ini dapat dibaca warga pada detail dan pelacakan laporan. Jangan tuliskan data pribadi atau catatan internal. Kosongkan lalu simpan untuk menghapus tanggapan publik.</p></div><button type="button" className="mod-button" disabled={disabled || publicResponse.trim() === (selectedReport.publicAdminResponse || "")} onClick={() => runAction("public-response", "public-response", { publicAdminResponse: publicResponse }, () => notify("Tanggapan publik berhasil disimpan."), "PUT")}>{busy === "public-response" ? "Menyimpan…" : "Simpan tanggapan publik"}</button></section>
              <section className="mod-section" aria-labelledby="decision-heading"><div className="mod-decision-heading"><h3 id="decision-heading">Catatan dan keputusan</h3>{selectedReport.status === "MENUNGGU_VERIFIKASI" ? <button type="button" onClick={handleVerifyReport} disabled={disabled} className="mod-button"><CheckCircle2 size={17} aria-hidden="true" />{busy==="verify"?"Memverifikasi…":"Verifikasi saja"}</button> : selectedReport.canCancelVerification ? <button ref={cancelTrigger} type="button" className="mod-button" disabled={disabled} onClick={() => { setCancelReason(""); setCancelError(null); setToastMsg(null); cancelDialog.current?.showModal(); }}>Batalkan verifikasi</button> : null}</div><div className="mod-field"><label htmlFor="admin-note">Catatan koreksi admin</label><textarea id="admin-note" maxLength={4000} rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} disabled={disabled} aria-describedby="admin-note-help" /><p id="admin-note-help" className="mod-helper">Catatan internal untuk admin dan instansi. Tidak ditampilkan kepada warga dan tidak mengubah laporan asli.</p></div>{mergeError && <p role="alert" className="mod-helper">{mergeError}</p>}<div className="mod-secondary-actions"><div className="mod-field"><label htmlFor="merge-master">Kode tiket induk</label><div className="mod-inline-control"><ReportTicketPicker key={selectedId} id="merge-master" options={mergeCandidates} value={mergeMasterCode} onChange={setMergeMasterCode} disabled={disabled || !isLiveDb} /><button ref={mergeTrigger} type="button" aria-haspopup="dialog" onClick={() => { setToastMsg(null); setMessageError(false); setShowMergeModal(true); }} disabled={disabled || !mergeCandidates.some(report => report.ticketCode === mergeMasterCode)} className="mod-button"><GitMerge size={16} aria-hidden="true" />Gabung</button></div></div><div className="mod-field"><label htmlFor="reject-reason">Alasan penolakan (wajib)</label><select id="reject-reason" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} disabled={disabled}><option value="">Pilih alasan</option><option value="SPAM">Spam / Foto Tidak Relevan</option><option value="PII_SARA">Memuat Tuduhan / PII Pihak Lain</option><option value="OUTSIDE_SCOPE">Bukan Infrastruktur Jalan</option></select><button ref={rejectTrigger} type="button" className="mod-button mod-danger" disabled={disabled || !rejectReason} aria-haspopup="dialog" onClick={() => { setToastMsg(null); setMessageError(false); setShowRejectModal(true); }}>Tolak laporan</button></div></div></section>
              <section className="mod-section mod-routing" aria-labelledby="routing-heading"><h3 id="routing-heading">{selectedReport.status === "MENUNGGU_VERIFIKASI" ? "Verifikasi & teruskan" : "Penugasan ke instansi"}</h3>{canForward && <><p>Pilih instansi berwenang setelah memeriksa laporan. Konfirmasi berikutnya menampilkan ringkasan dan pratinjau email.</p><div className="mod-field"><label htmlFor="selected-agency">Instansi berwenang</label><select id="selected-agency" value={selectedAgency} onChange={e => setSelectedAgency(e.target.value)} disabled={disabled || !agencyOptions.length}><option value="" disabled>Pilih instansi</option>{agencyOptions.map(agency => <option key={agency.code} value={agency.code}>{agency.name}</option>)}</select></div>{agencyError && <p role="alert" className="mod-helper">{agencyError}</p>}<button type="button" onClick={() => { setToastMsg(null); dialogTrigger.current = document.activeElement as HTMLElement; setShowEmailModal(true); }} disabled={disabled || !selectedAgencyInfo} className="mod-button mod-primary"><Send size={16} aria-hidden="true" />{selectedReport.status === "MENUNGGU_VERIFIKASI" ? "Verifikasi & teruskan" : "Teruskan ke instansi"}</button></>}{selectedReport.escalationEmail && !selectedReport.returnedByAgency && <div className="mod-email-delivery"><p role="status"><strong>Status email:</strong> {["SENT", "DELIVERED"].includes(selectedReport.escalationEmail.deliveryStatus) ? "Terkirim" : selectedReport.escalationEmail.deliveryStatus === "QUEUED" ? "Sedang diproses" : "Belum berhasil dikirim"}</p>{selectedReport.escalationEmail.failureReason && <p className="mod-helper">{selectedReport.escalationEmail.failureReason}</p>}<p className="mod-helper">Kegagalan email tidak membatalkan penugasan. Instansi tetap dapat melihat laporan pada dashboardnya.</p>{selectedReport.escalationEmail.canRetry && <button type="button" className="mod-button" disabled={disabled} onClick={handleRetryEmail}><Send size={16} aria-hidden="true" />{busy === "retry-email" ? "Mengirim ulang…" : "Kirim ulang email"}</button>}</div>}{!canForward && !selectedReport.escalationEmail && <p className="mod-helper">Penugasan tersedia untuk laporan yang menunggu verifikasi, terverifikasi, atau dibuka kembali.</p>}</section>
            </>}
          </section>
        </div>
      </div>
      <dialog ref={mergeDialog} className="mod-modal mod-reject-dialog mod-merge-dialog" aria-labelledby="merge-dialog-heading" aria-describedby="merge-dialog-description" onClose={() => setShowMergeModal(false)} onCancel={event => { if (busyRef.current) event.preventDefault(); }}>
        <form onSubmit={event => { event.preventDefault(); void handleMergeDuplicate(); }}>
          <div className="mod-reject-icon mod-merge-icon"><GitMerge size={24} aria-hidden="true" /></div>
          <h2 id="merge-dialog-heading">Gabungkan laporan ini?</h2>
          <p id="merge-dialog-description">Laporan yang dipilih akan ditandai sebagai duplikat. Dukungan dan tag kondisi akan dipindahkan ke laporan induk. Pastikan kedua laporan membahas kerusakan yang sama.</p>
          <dl className="mod-reject-summary"><div><dt>Laporan yang digabung</dt><dd>{selectedReport?.ticketCode}<span>{selectedReport?.title}</span></dd></div><div><dt>Laporan induk</dt><dd>{mergeMasterCode}<span>{mergeCandidates.find(report => report.ticketCode === mergeMasterCode)?.title}</span></dd></div></dl>
          {messageError && toastMsg && <p role="alert" className="mod-notice mod-error">{toastMsg}</p>}
          <div className="mod-modal-actions"><button type="button" autoFocus className="mod-button" disabled={Boolean(busy)} onClick={() => setShowMergeModal(false)}>Batal</button><button type="submit" className="mod-button mod-primary" disabled={disabled || !mergeCandidates.some(report => report.ticketCode === mergeMasterCode)} aria-busy={busy === "merge"}><GitMerge size={16} aria-hidden="true" />{busy === "merge" ? "Menggabungkan…" : "Ya, gabungkan laporan"}</button></div>
        </form>
      </dialog>
      <dialog ref={rejectDialog} className="mod-modal mod-reject-dialog" aria-labelledby="reject-dialog-heading" aria-describedby="reject-dialog-description" onClose={() => setShowRejectModal(false)} onCancel={event => { if (busyRef.current) event.preventDefault(); }} onClick={event => { if (event.target === event.currentTarget && !busyRef.current) setShowRejectModal(false); }}>
        <form onSubmit={event => { event.preventDefault(); void handleRejectReport(rejectReason); }}>
          <div className="mod-reject-icon"><AlertTriangle size={24} aria-hidden="true" /></div>
          <h2 id="reject-dialog-heading">Tolak laporan ini?</h2>
          <p id="reject-dialog-description">Laporan akan berstatus Ditolak. Alasan penolakan dapat dilihat oleh pelapor saat melacak tiket.</p>
          <dl className="mod-reject-summary"><div><dt>Laporan</dt><dd>{selectedReport?.ticketCode}<span>{selectedReport?.title}</span></dd></div><div><dt>Alasan penolakan</dt><dd>{REJECT_LABELS[rejectReason]}</dd></div></dl>
          {messageError && toastMsg && <p role="alert" className="mod-notice mod-error">{toastMsg}</p>}
          <div className="mod-modal-actions"><button type="button" autoFocus className="mod-button" disabled={Boolean(busy)} onClick={() => setShowRejectModal(false)}>Batal</button><button type="submit" className="mod-button mod-danger" disabled={disabled || !REJECT_LABELS[rejectReason]} aria-busy={busy === "reject"}>{busy === "reject" ? "Menolak laporan…" : "Ya, tolak laporan"}</button></div>
        </form>
      </dialog>
      <dialog ref={cancelDialog} className="mod-modal mod-cancel-dialog" aria-labelledby="cancel-verification-heading" aria-describedby="cancel-verification-help" onCancel={event => { if (busyRef.current) event.preventDefault(); }} onClose={() => cancelTrigger.current?.focus()}>
        <form onSubmit={handleCancelVerification}>
          <div className="mod-modal-heading"><h2 id="cancel-verification-heading">Batalkan verifikasi?</h2><button type="button" className="mod-close" aria-label="Tutup pembatalan verifikasi" disabled={Boolean(busy)} onClick={() => cancelDialog.current?.close()}><X size={20} aria-hidden="true" /></button></div>
          <p id="cancel-verification-help">Laporan {selectedReport?.ticketCode} akan kembali menunggu verifikasi dan tidak ditampilkan di peta publik. Alasan pembatalan disimpan dalam catatan admin dan riwayat audit.</p>
          <div className="mod-field"><label htmlFor="cancel-verification-reason">Alasan pembatalan (wajib)</label><textarea id="cancel-verification-reason" autoFocus required maxLength={2000} rows={4} value={cancelReason} onChange={event => { setCancelReason(event.target.value); setCancelError(null); }} disabled={Boolean(busy)} aria-invalid={Boolean(cancelError)} /></div>
          {(cancelError || (messageError && toastMsg)) && <p role="alert" className="mod-notice mod-error">{cancelError || toastMsg}</p>}
          <div className="mod-modal-actions"><button type="button" className="mod-button" disabled={Boolean(busy)} onClick={() => cancelDialog.current?.close()}>Kembali</button><button type="submit" className="mod-button mod-danger" disabled={disabled || !cancelReason.trim()}>{busy === "cancel-verification" ? "Membatalkan…" : "Ya, batalkan verifikasi"}</button></div>
        </form>
      </dialog>
      {showEmailModal && selectedReport && <div className="mod-modal-overlay"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="email-heading" className="mod-modal"><div className="mod-modal-heading"><h2 id="email-heading">{selectedReport.status === "MENUNGGU_VERIFIKASI" ? "Konfirmasi verifikasi & penerusan" : "Konfirmasi penerusan laporan"}</h2><button type="button" autoFocus onClick={() => setShowEmailModal(false)} disabled={Boolean(busy)} className="mod-close" aria-label="Tutup pratinjau"><X size={20} aria-hidden="true" /></button></div><p>{selectedReport.status === "MENUNGGU_VERIFIKASI" ? "Laporan akan diverifikasi lalu ditugaskan ke instansi berikut. Jika penugasan gagal, verifikasi tetap tersimpan." : "Laporan akan ditugaskan ke instansi berikut tanpa mengulangi verifikasi."}</p><dl className="mod-email-meta"><div><dt>Laporan</dt><dd>{selectedReport.ticketCode} — {selectedReport.title}</dd></div><div><dt>Penerima resmi</dt><dd>{selectedAgencyInfo?.name || "Instansi belum dipilih"}<br />{selectedAgencyInfo?.officialEmails.join(", ") || "Alamat email instansi belum dikonfigurasi"}</dd></div><div><dt>Subjek</dt><dd>[ESKALASI RESMI SIJAGO {selectedReport.ticketCode}] {selectedReport.title}</dd></div></dl><div className="mod-email-body">{selectedReport.draftSource === "AI" && <span className="mod-draft">Label sumber teks: {cleanLabel(selectedReport.permanentLabel)}</span>}<ReportDescription description={selectedReport.description} fallbackBody={selectedReport.body} /><p>Koordinat: {selectedReport.lat}, {selectedReport.lng} ({selectedReport.districtName})</p><p>Catatan admin: {adminNote || "Tidak ada catatan tambahan."}</p><p>Identitas pelapor tidak disertakan dalam email.</p></div>{toastMsg && messageError && <p role="alert" className="mod-notice mod-error">{toastMsg}</p>}<div className="mod-modal-actions"><button type="button" onClick={() => setShowEmailModal(false)} disabled={Boolean(busy)} className="mod-button">Batal</button><button type="button" onClick={handleEscalateEmail} disabled={Boolean(busy)} className="mod-button mod-primary"><Send size={16} aria-hidden="true" />{busy==="escalate"?"Memproses…":selectedReport.status === "MENUNGGU_VERIFIKASI" ? "Konfirmasi verifikasi & teruskan" : "Konfirmasi & teruskan"}</button></div></div></div>}
    </main>
  );
}
