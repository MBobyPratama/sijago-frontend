"use client";

import { ReportDescription } from "@/components/ReportDescription";

import { PhotoPreview } from "@/components/PhotoPreview";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ReportItem, STATUS_BADGE_MAP } from "@/lib/reportTypes";
import { BogorMap } from "@/components/map/BogorMap";
import { apiFetch, getClientFingerprint } from "@/lib/api";
import {
  ThumbsUp,
  Tag,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Clock,
  ArrowLeft,
  MailCheck,
  Send,
  MapPin,
  X,
} from "lucide-react";

import "./detail.css";

const CONDITION_TAG_OPTIONS = [
  { code: "MAKIN_DALAM", label: "Makin Dalam" },
  { code: "RAWAN_MALAM", label: "Rawan Kecelakaan Malam" },
  { code: "TERTUTUP_AIR", label: "Tertutup Genangan Air" },
  { code: "SERING_CELAKA", label: "Sering Buat Jatuh" },
];

type DetailReport = ReportItem & { photos?: { id: string; kind: string; publicUrl: string }[] };
const normalizeDetailReport = (report: DetailReport): DetailReport => ({ ...report, conditionTags: Array.isArray(report.conditionTags) ? report.conditionTags : [] });
const cleanLabel = (value: string) => value.replace(/^[^\p{L}\p{N}\[]+/u, "");

export default function DetailLaporanPage() {
  const params = useParams<{ id: string }>();
  const reportId = params?.id || "";
  const [report, setReport] = useState<DetailReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    setReport(null); setError(null);
    apiFetch<DetailReport>(`/public/reports/${encodeURIComponent(reportId)}`).then(res => {
      if (!current) return;
      if (res.success && res.data) setReport(normalizeDetailReport(res.data));
      else setError(res.error?.detail || "Laporan tidak ditemukan.");
    }).catch(() => { if (current) setError("Laporan belum dapat dimuat. Periksa koneksi lalu coba lagi."); });
    return () => { current = false; };
  }, [reportId]);
  if (!report) return <main className="report-detail"><div className="detail-container"><Link href="/" className="detail-back">Kembali ke peta</Link><h1>{error ? "Laporan belum tersedia" : "Memuat laporan…"}</h1><p role={error ? "alert" : "status"}>{error || "Mengambil data laporan dari server."}</p></div></main>;
  return <LoadedReportDetail key={reportId} initialReport={report} reportId={reportId} />;
}

function LoadedReportDetail({ initialReport, reportId }: { initialReport: DetailReport; reportId: string }) {
  const [report, setReport] = useState<DetailReport>(() => normalizeDetailReport(initialReport));
  const [upvoted, setUpvoted] = useState(false);

  // OTP Modal & Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const otpTriggerRef = useRef<HTMLElement | null>(null);
  const openOtp = () => { otpTriggerRef.current = document.activeElement as HTMLElement; setShowOtpModal(true); };
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showOtpModal) return;
    const trigger = otpTriggerRef.current;
    const background = document.querySelector(".detail-container");
    background?.setAttribute("inert", "");
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowOtpModal(false);
      if (event.key !== "Tab") return;
      const controls = modalRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), a[href]");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { background?.removeAttribute("inert"); document.removeEventListener("keydown", trap); trigger?.focus(); };
  }, [showOtpModal]);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpChallenge, setOtpChallenge] = useState<string | null>(null);
  const otpBusy = useRef(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStatusMsg, setOtpStatusMsg] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Condition Tag selection
  const [selectedTagCode, setSelectedTagCode] = useState("MAKIN_DALAM");
  const [tagStatusMsg, setTagStatusMsg] = useState<string | null>(null);
  const [tagSaving, setTagSaving] = useState(false);
  const tagRequestBusy = useRef(false);

  // Community Sign-Off state
  const [signoffVote, setSignoffVote] = useState<"MULUS" | "CEPAT_RUSAK" | null>(null);
  const [signoffComment, setSignoffComment] = useState("");
  const [reopenedTriggered, setReopenedTriggered] = useState(false);
  const [signoffMsg, setSignoffMsg] = useState<string | null>(null);
  const [signoffSaving, setSignoffSaving] = useState(false);
  const signoffBusy = useRef(false);

  const loadReportDetail = useCallback(async () => {
    try {
      const res = await apiFetch<DetailReport>(
        `/public/reports/${encodeURIComponent(reportId)}`
      );
      if (res.success && res.data) {
        setReport(normalizeDetailReport(res.data));
        if (res.data.status === "DIBUKA_KEMBALI") {
          setReopenedTriggered(true);
        }
        return true;
      }
    } catch {
      // Retain the last complete report when refreshing fails.
    }
    return false;
  }, [reportId]);

  useEffect(() => {
    loadReportDetail();
  }, [loadReportDetail]);

  const handleToggleUpvote = async () => {
    try {
      const res = await apiFetch<{ upvoted: boolean; upvotesCount: number }>(
        `/public/reports/${encodeURIComponent(report.id)}/upvote`,
        {
          method: "POST",
          body: JSON.stringify({ fingerprint: getClientFingerprint() }),
        }
      );
      if (res.success && res.data) {
        setUpvoted(res.data.upvoted);
        setReport((prev) => ({ ...prev, upvotes: res.data!.upvotesCount }));
        return;
      }
    } catch {
      // Fallback
    }

  };

  const handleRequestOtp = async () => {
    if (otpBusy.current) return;
    otpBusy.current = true;
    setOtpChallenge(null); setOtpCode("");
    setOtpLoading(true);
    setOtpStatusMsg(null);
    try {
      const res = await apiFetch<{
        challengeId: string;
        sentViaResend: boolean;
      }>("/auth/otp/request", {
        method: "POST",
        headers: { "X-Device-Id": getClientFingerprint() },
        body: JSON.stringify({ email: otpEmail, reportId: report.id }),
      });
      if (res.success && res.data?.challengeId) {
        setOtpChallenge(res.data.challengeId);
        setOtpStatusMsg(`Kode verifikasi telah dikirim ke ${otpEmail}. Periksa kotak masuk Anda.`);
      } else {
        setOtpStatusMsg(res.error?.detail || "Gagal meminta OTP.");
      }
    } catch {
      setOtpStatusMsg("Kode verifikasi belum dapat dikirim. Silakan coba lagi.");
    } finally {
      otpBusy.current = false;
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpBusy.current || !otpChallenge || !/^\d{6}$/.test(otpCode)) return;
    otpBusy.current = true;
    setOtpLoading(true);
    try {
      const res = await apiFetch<{ verified: boolean; otpToken: string }>("/auth/otp/verify", {
        method: "POST",
        headers: { "X-Device-Id": getClientFingerprint() },
        body: JSON.stringify({
          email: otpEmail,
          code: otpCode,
          reportId: report.id,
          challengeId: otpChallenge,
        }),
      });
      if (res.success && res.data?.verified) {
        setOtpVerified(true);
        setOtpToken(res.data.otpToken);
        setShowOtpModal(false);
        return;
      }
      setOtpStatusMsg(res.error?.detail || "Kode OTP tidak valid.");
    } catch {
      setOtpStatusMsg("Verifikasi gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      otpBusy.current = false;
      setOtpLoading(false);
    }
  };

  const handleVerificationFailure = (error?: { code: string; detail: string }) => {
    if (!error || !["OTP_REQUIRED", "OTP_EXPIRED", "OTP_SCOPE_MISMATCH"].includes(error.code)) return;
    setOtpVerified(false); setOtpToken(null); setOtpChallenge(null); setOtpCode("");
    setOtpStatusMsg(error.detail || "Verifikasi email kembali untuk melanjutkan.");
    openOtp();
  };

  const handleAddConditionTag = async () => {
    if (tagRequestBusy.current) return;
    if (!otpVerified) {
      openOtp();
      return;
    }
    tagRequestBusy.current = true;
    setTagSaving(true);
    setTagStatusMsg(null);
    try {
      const res = await apiFetch<{
        conditionTags?: { code: string; label: string; count: number }[];
      }>(`/public/reports/${encodeURIComponent(report.id)}/tags`, {
        method: "POST",
        headers: { "X-Device-Id": getClientFingerprint() },
        body: JSON.stringify({
          tagCode: selectedTagCode,
          email: otpEmail,
          otpToken,
        }),
      });
      if (res.success && res.data) {
        if (Array.isArray(res.data.conditionTags)) {
          const conditionTags = res.data.conditionTags;
          setReport(prev => ({ ...prev, conditionTags }));
          setTagStatusMsg("Tag kondisi berhasil ditambahkan.");
        } else {
          const refreshed = await loadReportDetail();
          setTagStatusMsg(refreshed ? "Tag kondisi berhasil ditambahkan." : "Tag tersimpan, tetapi daftar terbaru belum dapat dimuat. Segarkan halaman untuk melihatnya.");
        }
        return;
      }
      handleVerificationFailure(res.error);
      setTagStatusMsg(res.error?.detail || "Tag sudah pernah Anda tambahkan.");
    } catch {
      setTagStatusMsg("Tag kondisi belum tersimpan. Silakan coba lagi.");
    } finally {
      tagRequestBusy.current = false;
      setTagSaving(false);
    }
  };

  const handleSubmitSignoff = async (choice: "MULUS" | "CEPAT_RUSAK") => {
    if (signoffBusy.current) return;
    if (!otpVerified) {
      openOtp();
      return;
    }
    signoffBusy.current = true;
    setSignoffSaving(true);
    try {
      const res = await apiFetch<{
        decision: "MULUS" | "CEPAT_RUSAK";
        mulusCount: number;
        cepatRusakCount: number;
        reopenedTriggered: boolean;
      }>(`/public/reports/${encodeURIComponent(report.id)}/signoff`, {
        method: "POST",
        headers: { "X-Device-Id": getClientFingerprint() },
        body: JSON.stringify({
          decision: choice,
          comment: signoffComment,
          email: otpEmail,
          fingerprint: getClientFingerprint(),
          otpToken,
        }),
      });
      if (res.success && res.data) {
        setSignoffVote(choice);
        setReport((prev) => ({
          ...prev,
          status: res.data!.reopenedTriggered ? "DIBUKA_KEMBALI" : prev.status,
          signoffSummary: {
            ...prev.signoffSummary,
            mulusCount: res.data!.mulusCount,
            cepatRusakCount: res.data!.cepatRusakCount,
          },
        }));
        if (res.data.reopenedTriggered) {
          setReopenedTriggered(true);
        }
        setSignoffMsg("✓ Suara Community Sign-Off Anda berhasil disimpan di database Neon!");
        return;
      }
      handleVerificationFailure(res.error);
      setSignoffMsg(res.error?.detail || "Anda sudah pernah memberikan penilaian pada siklus ini.");
    } catch {
      setSignoffMsg("Penilaian belum tersimpan. Silakan coba lagi.");
    } finally { signoffBusy.current = false; setSignoffSaving(false); }
  };

  const signoffAvailable = ["SELESAI", "DIBUKA_KEMBALI"].includes(report.status) && report.signoffSummary.monitoringDaysLeft > 0;
  const statusInfo = STATUS_BADGE_MAP[report.status] || STATUS_BADGE_MAP.TERVERIFIKASI;
  const signoffStatusEligible = ["SELESAI", "DIBUKA_KEMBALI"].includes(report.status);
  const signoffUnavailableReason = !signoffStatusEligible
    ? `Laporan masih berstatus “${statusInfo.label}”. Komentar dan penilaian hasil perbaikan baru tersedia setelah perbaikan selesai dan masa pemantauan dimulai.`
    : "Masa pemantauan hasil perbaikan sudah berakhir atau belum tersedia. Komentar dan penilaian ditutup karena tidak ada masa pemantauan yang aktif.";

  const beforePhotos = report.photos?.filter((photo) => (photo.kind === "BEFORE" || photo.kind === "REPORT")) || [];
  const afterPhotos = report.photos?.filter((photo) => photo.kind === "AFTER") || [];

  return (
    <main className="report-detail">
      <div className="detail-container">
        <Link href="/" className="detail-back"><ArrowLeft size={16} aria-hidden="true" />Kembali ke Peta Publik</Link>
        <header className="detail-heading">
          <div className="detail-identifiers">
            <span className="detail-ticket">{report.ticketCode}</span>
            <span role="status" className={`detail-status status-${reopenedTriggered ? "DIBUKA_KEMBALI" : report.status}`}>{reopenedTriggered ? STATUS_BADGE_MAP.DIBUKA_KEMBALI.label : statusInfo.label}</span>
          </div>
          <h1>{report.title}</h1>
          <p className="detail-address"><MapPin size={18} aria-hidden="true" />{report.suggestedStreetName || report.landmark}</p>

        </header>

        <div className="detail-grid">
          <div className="detail-main">
            <section className="detail-section" aria-labelledby="description-heading">
              <h2 id="description-heading">Kondisi yang dilaporkan</h2>
              <ReportDescription description={report.description} fallbackBody={report.body} />
              <div className="detail-support">
                <button type="button" onClick={handleToggleUpvote} aria-pressed={upvoted} className={`detail-button ${upvoted ? "is-selected" : ""}`}><ThumbsUp size={18} aria-hidden="true" />{upvoted ? "Sudah didukung" : "+1 Saya Lewat Sini"}<span>{report.upvotes}</span></button>
              </div>
            </section>

            {report.publicAdminResponse && <section className="detail-section" aria-labelledby="public-response-heading"><h2 id="public-response-heading">Tanggapan admin</h2><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{report.publicAdminResponse}</p></section>}

            <section className="detail-section" aria-labelledby="photos-heading">
              <h2 id="photos-heading">Bukti kondisi jalan</h2>
              <div className="detail-photos">
                {[{label: "Sebelum perbaikan", photos: beforePhotos, empty: "Foto dari warga belum tersedia."}, {label: "Sesudah perbaikan", photos: afterPhotos, empty: "Foto dari instansi belum tersedia."}].map((group) => <figure key={group.label}>
                  <figcaption>{group.label}</figcaption>
                  {group.photos.length ? group.photos.map((photo, index) => <PhotoPreview key={photo.id} photos={group.photos.map(item => ({ ...item, alt: `Bukti kondisi jalan ${group.label.toLowerCase()}` }))} index={index} label={`Lihat foto ${group.label.toLowerCase()}`}><img src={photo.publicUrl} alt={`Bukti kondisi jalan ${group.label.toLowerCase()}`} /></PhotoPreview>) : <p className="detail-photo-empty">{group.empty}</p>}
                </figure>)}
              </div>
            </section>

            <section className="detail-section" aria-labelledby="conditions-heading">
              <h2 id="conditions-heading">Kondisi terbaru dari warga</h2>
              <div className="detail-tags">{report.conditionTags.map((tag) => <span key={tag.code}>{cleanLabel(tag.label)} <strong>{tag.count}</strong></span>)}</div>
              <div className="detail-tag-form">
                <div className="detail-field"><label htmlFor="condition-tag">Kondisi yang Anda temui</label><select id="condition-tag" disabled={tagSaving} value={selectedTagCode} onChange={(e) => setSelectedTagCode(e.target.value)}>{CONDITION_TAG_OPTIONS.map((opt) => <option key={opt.code} value={opt.code}>{opt.label}</option>)}</select></div>
                <button type="button" onClick={handleAddConditionTag} disabled={tagSaving} aria-busy={tagSaving} className="detail-button"><Tag size={18} aria-hidden="true" />{tagSaving ? "Menambahkan tag…" : "Tambah tag kondisi"}</button>
              </div>
              <p className="detail-helper">Verifikasi email diperlukan untuk menambahkan tag.</p>
              {tagStatusMsg && <p role="status" className="detail-message">{tagStatusMsg}</p>}
            </section>

            <section className="detail-section" aria-labelledby="signoff-heading">
              <div className="detail-section-title"><h2 id="signoff-heading">Bagaimana hasil perbaikannya?</h2><span className="detail-monitoring"><Clock size={16} aria-hidden="true" />{signoffAvailable ? `${report.signoffSummary.monitoringDaysLeft} hari pemantauan tersisa` : signoffStatusEligible ? "Pemantauan tidak aktif" : "Menunggu perbaikan selesai"}</span></div>
              <p>Bagian ini untuk menilai hasil perbaikan jalan, bukan komentar umum tentang laporan. Komentar dikirim bersama penilaian selama masa pemantauan berlangsung.</p>
              <div className="detail-votes"><span>Mulus <strong>{report.signoffSummary.mulusCount}</strong></span><span>Cepat rusak <strong>{report.signoffSummary.cepatRusakCount}</strong></span></div>
              <div className="detail-verification">{otpVerified ? <span><MailCheck size={18} aria-hidden="true" />Email terverifikasi: {otpEmail}</span> : <button type="button" className="detail-text-button" onClick={openOtp}>Verifikasi email untuk menilai</button>}</div>
              <p id="signoff-availability" className={signoffAvailable ? "detail-helper" : "detail-message"} role="status">{signoffAvailable ? otpVerified ? "Email sudah terverifikasi. Isi komentar jika diperlukan, lalu pilih penilaian untuk mengirimnya." : "Komentar dan penilaian sudah tersedia. Verifikasi email diperlukan sebelum penilaian dapat dikirim." : `${signoffUnavailableReason} Verifikasi email saja tidak membuka kolom ini. Untuk melaporkan kondisi saat ini, gunakan “Tambah tag kondisi” di atas.`}</p>
              <div className="detail-field"><label htmlFor="signoff-comment">Komentar kondisi perbaikan (opsional)</label><input id="signoff-comment" aria-describedby="signoff-availability" disabled={!signoffAvailable || signoffSaving} maxLength={500} type="text" value={signoffComment} onChange={(e) => setSignoffComment(e.target.value)} placeholder={signoffAvailable ? "Ceritakan kondisi jalan setelah diperbaiki" : "Komentar belum tersedia"} /></div>
              <div className="detail-rating-actions">
                <button type="button" disabled={!signoffAvailable || signoffSaving} aria-busy={signoffSaving} onClick={() => handleSubmitSignoff("MULUS")} aria-pressed={signoffVote === "MULUS"} className={`detail-button ${signoffVote === "MULUS" ? "is-selected" : ""}`}><CheckCircle2 size={18} aria-hidden="true" />Mulus & tahan hujan</button>
                <button type="button" disabled={!signoffAvailable || signoffSaving} aria-busy={signoffSaving} onClick={() => handleSubmitSignoff("CEPAT_RUSAK")} aria-pressed={signoffVote === "CEPAT_RUSAK"} className={`detail-button ${signoffVote === "CEPAT_RUSAK" ? "is-selected" : ""}`}><AlertOctagon size={18} aria-hidden="true" />Cepat rusak</button>
              </div>
              {signoffAvailable && <p className="detail-helper">Laporan dibuka kembali jika ambang jumlah dan proporsi suara cepat rusak pada konfigurasi sistem terpenuhi.</p>}
              {reopenedTriggered && <div role="status" className="detail-alert"><ShieldAlert size={22} aria-hidden="true" /><div><strong>Laporan dibuka kembali</strong><p>Ambang suara cepat rusak tercapai. Admin menerima notifikasi untuk menindaklanjuti laporan ini.</p></div></div>}
              {signoffMsg && <p role="status" className="detail-message">{signoffMsg}</p>}
            </section>
          </div>

          <aside className="detail-sidebar" aria-label="Fakta dan lokasi laporan">
            <section className="detail-facts">
              <h2>Informasi laporan</h2>
              <dl><div><dt>Kecamatan / Kelurahan</dt><dd>{report.districtName}, {report.subdistrictName}</dd></div><div><dt>Kategori & ukuran</dt><dd>{report.category.replaceAll("_", " ").toLowerCase()} ({report.dimensionsCm})</dd></div><div><dt>Instansi tujuan</dt><dd>{report.assignedAgency || "Menunggu routing admin"}</dd></div><div><dt>Skor prioritas</dt><dd>{report.priorityScore} / 100</dd></div></dl>
            </section>
            <section className="detail-location" aria-labelledby="map-heading"><h2 id="map-heading">Lokasi laporan</h2><BogorMap reports={[report]} centerLat={report.lat} centerLng={report.lng} zoom={15} className="detail-map" /><p>{report.landmark}</p><p className="detail-helper">Jika peta belum tampil, gunakan patokan lokasi di atas.</p></section>
          </aside>
        </div>
      </div>

      {showOtpModal && <div className="detail-modal-overlay"><div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="otp-heading" className="detail-modal" onKeyDown={(e) => { if(e.key === "Escape") setShowOtpModal(false); }}>
        <div className="detail-section-title"><h2 id="otp-heading">Verifikasi email Anda</h2><button autoFocus type="button" aria-label="Tutup verifikasi" onClick={() => setShowOtpModal(false)} className="detail-close"><X size={20} aria-hidden="true" /></button></div>
        <p>Untuk mencegah penyalahgunaan tag kondisi dan brigading pada penilaian Community Sign-Off, masukkan email Anda untuk menerima kode OTP 6 digit sekali pakai.</p>
        <div className="detail-field"><label htmlFor="otp-email">Alamat email warga</label><input id="otp-email" type="email" disabled={otpLoading} value={otpEmail} onChange={(e) => { setOtpEmail(e.target.value); setOtpChallenge(null); setOtpCode(""); setOtpVerified(false); setOtpToken(null); }} /></div>
        <button type="button" disabled={otpLoading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail.trim())} onClick={handleRequestOtp} className="detail-button"><Send size={16} aria-hidden="true" />{otpLoading ? "Memproses…" : "Kirim OTP"}</button>
        {otpStatusMsg && <p role="status" className="detail-message">{otpStatusMsg}</p>}
        <div className="detail-field"><label htmlFor="otp-code">Kode OTP 6 digit</label><input id="otp-code" maxLength={6} disabled={otpLoading || !otpChallenge} type="text" inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Masukkan kode OTP" /></div>
        <div className="detail-rating-actions"><button type="button" onClick={() => setShowOtpModal(false)} className="detail-button">Batal</button><button type="button" disabled={otpLoading || !otpChallenge || !/^\d{6}$/.test(otpCode)} onClick={handleVerifyOtp} className="detail-button detail-primary">Verifikasi & lanjutkan</button></div>
      </div></div>}
    </main>
  );
}
