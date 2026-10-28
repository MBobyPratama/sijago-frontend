"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { ShieldAlert, Download, RefreshCw, Search, ChevronDown, ChevronUp, Link2, X } from "lucide-react";
import "./audit.css";

interface AuditLogEntry {
  id: number;
  occurredAt: string;
  reportId: string | null;
  actorId: string;
  actorType: string;
  actionType: string;
  snapshotBefore: unknown;
  snapshotAfter: unknown;
  prevEntryHash: string;
  entryHash: string;
}

const FALLBACK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 1084,
    occurredAt: "2026-10-25T16:12:04.000Z",
    reportId: "SJG-2026-1042",
    actorType: "ADMIN",
    actorId: "admin_sabira_01",
    actionType: "ESCALATION_EMAIL_SENT",
    snapshotBefore: { status: "TERVERIFIKASI" },
    snapshotAfter: {
      status: "DITERUSKAN",
      recipient: "pupr.kotabogor@sijago.simulasi.id",
    },
    prevEntryHash: "8f14e45fceea467fa8f1",
    entryHash: "c39a11e072b1481091a3",
  },
];

const ACTION_LABELS: Record<string,string> = {
  AI_GENERATE_SUCCESS:"Draf AI dibuat", AI_FALLBACK_TEMPLATE:"Draf template dibuat", SOURCE_FACTS_MODIFIED:"Fakta Asal diperbarui", APPROVAL_GRANTED:"Persetujuan diberikan", APPROVAL_RESET:"Persetujuan dibatalkan", REPORT_SUBMITTED:"Laporan dikirim", VERIFY_REPORT:"Laporan diverifikasi", REJECT_REPORT:"Laporan ditolak", ROUTE_ASSIGNED:"Instansi ditetapkan", ESCALATION_EMAIL_SENT:"Email eskalasi dikirim", ESCALATION_EMAIL_FAILED:"Email eskalasi gagal", STATUS_CHANGED:"Status berubah", DUPLICATE_MERGED:"Duplikat digabung", SIGNOFF_SUBMITTED:"Penilaian warga dikirim", REOPENED:"Laporan dibuka kembali", ADMIN_OVERRIDE:"Status diubah admin", LOG_EXPORTED:"Log diekspor",
};
const formatUtc = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Waktu tidak tersedia" : date.toLocaleString("id-ID", {timeZone:"UTC",dateStyle:"medium",timeStyle:"medium"}) + " UTC";
};
const snapshotText = (value: unknown) => value == null ? "Tidak ada snapshot." : JSON.stringify(value,null,2);

export default function AdminAuditPage() {
  const [tamperAttemptTriggered, setTamperAttemptTriggered] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>(FALLBACK_AUDIT_LOGS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"sample"|"live">("sample");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const requestVersion = useRef(0);
  const hasLiveData = useRef(false);
  const fetchLogs = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<AuditLogEntry[]>("/audit/logs");
      if (version !== requestVersion.current) return;
      if (!res.success || !Array.isArray(res.data)) throw new Error(res.error?.detail || "Riwayat audit belum dapat dimuat.");
      setLogs(res.data); setSource("live"); hasLiveData.current = true;
      setPage(1); setExpandedId(null);
    } catch (err) {
      if (version !== requestVersion.current) return;
      setError(err instanceof Error ? err.message : "Koneksi ke server terputus. Coba muat ulang.");
      if (!hasLiveData.current) setSource("sample");
    } finally { if (version === requestVersion.current) setLoading(false); }
  },[]);
  useEffect(() => { fetchLogs(); return () => { requestVersion.current++; }; },[fetchLogs]);
  const actionOptions = [...new Set(logs.map(log=>log.actionType))].sort();
  const actorOptions = [...new Set(logs.map(log=>log.actorType))].sort();
  const filteredLogs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return logs.filter(log => (actionFilter==="ALL" || log.actionType===actionFilter) && (actorFilter==="ALL" || log.actorType===actorFilter) && `${log.id} ${log.reportId || ""} ${log.actorId} ${log.actionType} ${ACTION_LABELS[log.actionType] || ""}`.toLowerCase().includes(search));
  },[logs,query,actionFilter,actorFilter]);
  const totalPages = Math.max(1,Math.ceil(filteredLogs.length/10));
  const currentPage = Math.min(page,totalPages);
  const visibleLogs = filteredLogs.slice((currentPage-1)*10,currentPage*10);
  const resetFilters = () => { setQuery(""); setActionFilter("ALL"); setActorFilter("ALL"); setPage(1); };

  return (
    <main className="audit-page"><div className="audit-container">
      <header className="audit-heading"><div><h1>Riwayat audit</h1><p>Telusuri tindakan, pelaku, dan perubahan laporan tanpa mengubah catatannya.</p></div><button type="button" className="audit-button" onClick={fetchLogs} disabled={loading}><RefreshCw size={16} aria-hidden="true" />{loading?"Memuat riwayat…":"Segarkan riwayat"}</button></header>
      <div className="audit-context"><span role="status" className={source==="live"&&!error?"audit-source-live":"audit-source-warning"}>{error&&source==="live"?"Data terakhir, koneksi gagal":source==="live"?"Data dari server":"Data contoh"}</span><span><Link2 size={16} aria-hidden="true" />Hash tersimpan; integritas belum diperiksa.</span></div>
      {error && <div className="audit-notice audit-warning" role="alert"><ShieldAlert size={18} aria-hidden="true" /><p>{error} {source==="live"?"Data terakhir tetap ditampilkan. Coba segarkan kembali.":"Menampilkan contoh entri; bukan riwayat server."}</p></div>}
      <details className="audit-explanation"><summary>Perlindungan dan cakupan audit</summary><p>Tabel <code>report_audit_logs</code> bersifat append-only. Trigger <code>trg_protect_report_audit_logs</code> menolak UPDATE dan DELETE (FR-7.1). Hash sebelumnya dan hash entri tersedia untuk penelusuran, tetapi halaman ini belum menjalankan verifikasi hash chain.</p><p>Daftar ini hanya menampilkan entri yang dikembalikan API, bukan seluruh arsip. Pencarian dan filter berlaku pada data yang dimuat.</p></details>
      <section className="audit-workspace" aria-labelledby="audit-list-heading" aria-busy={loading}>
        <div className="audit-list-heading"><h2 id="audit-list-heading">Daftar peristiwa</h2><span>{filteredLogs.length} dari {logs.length} entri dimuat</span></div>
        <div className="audit-filters"><div className="audit-field audit-search"><label htmlFor="audit-search">Cari entri</label><div><Search size={16} aria-hidden="true" /><input id="audit-search" type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="ID, laporan, aktor, atau tindakan" /></div></div><div className="audit-field"><label htmlFor="audit-action">Jenis tindakan</label><select id="audit-action" value={actionFilter} onChange={e=>{setActionFilter(e.target.value);setPage(1);}}><option value="ALL">Semua tindakan</option>{actionOptions.map(action=><option key={action} value={action}>{ACTION_LABELS[action] || action}</option>)}</select></div><div className="audit-field"><label htmlFor="audit-actor">Tipe aktor</label><select id="audit-actor" value={actorFilter} onChange={e=>{setActorFilter(e.target.value);setPage(1);}}><option value="ALL">Semua aktor</option>{actorOptions.map(actor=><option key={actor} value={actor}>{actor}</option>)}</select></div></div>
        {loading ? <div className="audit-loading" role="status"><span /><span /><span /><p>Memuat daftar peristiwa audit…</p></div> : !visibleLogs.length ? <div className="audit-empty"><h3>{logs.length?"Tidak ada entri yang cocok":"Belum ada riwayat audit"}</h3><p>{logs.length?"Coba kata kunci atau filter lain.":"Peristiwa akan muncul setelah aktivitas sistem tercatat."}</p>{logs.length>0 && <button type="button" className="audit-button" onClick={resetFilters}>Reset filter</button>}</div> : <table className="audit-table"><caption className="audit-sr-only">Riwayat audit, waktu UTC. Buka detail untuk snapshot dan hash lengkap.</caption><thead><tr><th scope="col">Waktu / ID</th><th scope="col">Tindakan</th><th scope="col">Laporan</th><th scope="col">Aktor</th><th scope="col">Perubahan</th></tr></thead><tbody>{visibleLogs.map(log=><React.Fragment key={log.id}><tr className={expandedId===log.id?"audit-row-selected":""}><td><span className="audit-mobile-label">Waktu / ID</span><time dateTime={log.occurredAt}>{formatUtc(log.occurredAt)}</time><span className="audit-secondary">#{log.id}</span></td><td><span className="audit-mobile-label">Tindakan</span><strong>{ACTION_LABELS[log.actionType] || log.actionType}</strong><code className="audit-secondary">{log.actionType}</code></td><td><span className="audit-mobile-label">Laporan</span><span className="audit-report-id">{log.reportId || "Tidak terkait laporan"}</span></td><td><span className="audit-mobile-label">Aktor</span><span>{log.actorType}</span><span className="audit-secondary">{log.actorId}</span></td><td><button type="button" className="audit-button audit-detail-toggle" aria-expanded={expandedId===log.id} aria-controls={`audit-detail-${log.id}`} onClick={()=>setExpandedId(expandedId===log.id?null:log.id)}>{expandedId===log.id?<ChevronUp size={15} aria-hidden="true" />:<ChevronDown size={15} aria-hidden="true" />}{expandedId===log.id?"Tutup detail":"Lihat detail"}</button></td></tr><tr className="audit-detail-row" hidden={expandedId!==log.id}><td colSpan={5}><section id={`audit-detail-${log.id}`} aria-label={`Detail entri ${log.id}`} className="audit-entry-detail"><h3>Perubahan pada entri #{log.id}</h3><div className="audit-snapshots"><div><h4>Sebelum</h4><pre>{snapshotText(log.snapshotBefore)}</pre></div><div><h4>Sesudah</h4><pre>{snapshotText(log.snapshotAfter)}</pre></div></div><dl className="audit-hashes"><div><dt>Hash entri sebelumnya</dt><dd><code>{log.prevEntryHash || "Tidak tersedia"}</code></dd></div><div><dt>Hash entri ini</dt><dd><code>{log.entryHash || "Tidak tersedia"}</code></dd></div></dl><p className="audit-helper">Nilai hash ditampilkan sebagaimana diterima dari server, bukan hasil verifikasi integritas.</p></section></td></tr></React.Fragment>)}</tbody></table>}
        {!loading && filteredLogs.length>0 && <nav className="audit-pagination" aria-label="Halaman riwayat audit"><span>Halaman {currentPage} dari {totalPages}</span><div><button type="button" className="audit-button" disabled={currentPage===1} onClick={()=>{setPage(currentPage-1);setExpandedId(null);}}>Sebelumnya</button><button type="button" className="audit-button" disabled={currentPage===totalPages} onClick={()=>{setPage(currentPage+1);setExpandedId(null);}}>Berikutnya</button></div></nav>}
      </section>
      <section className="audit-tools" aria-labelledby="audit-tools-heading"><h2 id="audit-tools-heading">Peralatan audit</h2><div className="audit-tools-grid"><div><h3>Simulasi perlindungan log</h3><p>Pratinjau pesan penolakan perubahan. Simulasi ini tidak mengirim operasi UPDATE atau DELETE ke database.</p><button type="button" onClick={() => setTamperAttemptTriggered(true)} className="audit-button"><ShieldAlert size={16} aria-hidden="true" />Jalankan simulasi</button></div><div><h3>Ekspor CSV / JSON</h3><p>Ekspor harus tercatat sebagai LOG_EXPORTED. Endpoint ekspor audit belum tersedia; tombol ini belum dapat digunakan.</p><button type="button" disabled className="audit-button" aria-describedby="audit-export-help"><Download size={16} aria-hidden="true" />Ekspor log</button><span id="audit-export-help" className="audit-helper">Menunggu endpoint ekspor dengan pencatatan audit.</span></div></div></section>
      {tamperAttemptTriggered && <div role="status" className="audit-notice audit-warning audit-simulation"><div><h3>Contoh penolakan perubahan log</h3><p>Simulasi lokal, bukan hasil pengujian trigger database.</p><code>ERROR: SIJAGO SECURITY VIOLATION: Tabel report_audit_logs bersifat append-only dan tidak dapat diubah atau dihapus.</code></div><button type="button" onClick={() => setTamperAttemptTriggered(false)} className="audit-button"><X size={16} aria-hidden="true" />Tutup</button></div>}
    </div></main>
  );
}
