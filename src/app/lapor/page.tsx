"use client";

import { ReportDescription } from "@/components/ReportDescription";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "./lapor.css";
import imageCompression from "browser-image-compression";
import exifr from "exifr";
import { BogorMap } from "@/components/map/BogorMap";
import { TicketReceipt, type ReceiptEmailStatus } from "@/components/TicketReceipt";
import { saveTicket } from "@/lib/saved-tickets";
import type { ReportItem } from "@/lib/reportTypes";
import { apiFetch } from "@/lib/api";
import {
  Camera,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  LocateFixed,
  CircleHelp,
  Upload,
} from "lucide-react";

const NO_MAP_REPORTS: ReportItem[] = [];
const NEARBY_STATUS_LABELS: Record<string, string> = {
  TERVERIFIKASI: "Terverifikasi", DITERUSKAN: "Diteruskan", DIPROSES: "Diproses",
  SELESAI: "Selesai", DIBUKA_KEMBALI: "Dibuka kembali",
};

interface GeoValidateResponse {
  isInsideBogorCity: boolean;
  lat: number;
  lng: number;
  districtName: string;
  subdistrictName: string;
  suggestedStreetName: string;
  nearbyReportsAvailable?: boolean;
  nearbyActiveReports: {
    id: string;
    ticketCode: string;
    status: string;
    districtName: string;
    upvoteCount: number;
    distanceMeters: number;
  }[];
}

interface ReportDraftApiData {
  description?: import("@/components/ReportDescription").ReportDescriptionData;
  draftId: string;
  reportId: string;
  factsHash: string;
  sourceType: "AI" | "TEMPLATE";
  permanentLabel: "✨ [Draf Dibantu AI]" | "📄 [Draf Template]";
  title: string;
  body: string;
  fallbackNotice: string | null;
}

export default function LaporPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const previousStep = useRef(step);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // State ID Laporan di Neon PostgreSQL
  const [reportId, setReportId] = useState<string | null>(null);
  const [receiptEmailStatus, setReceiptEmailStatus] = useState<ReceiptEmailStatus>("NOT_REQUESTED");
  const [ticketCode, setTicketCode] = useState<string>("");

  // State Fakta Asal (Source of Truth)
  const [lat, setLat] = useState(-6.597147);
  const [lng, setLng] = useState(106.806039);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState(0);
  const [locationSource, setLocationSource] = useState<"GPS" | "MANUAL_PIN">("MANUAL_PIN");
  const [geoInfo, setGeoInfo] = useState<GeoValidateResponse>({
    isInsideBogorCity: true,
    lat: -6.597147,
    lng: 106.806039,
    districtName: "",
    subdistrictName: "",
    suggestedStreetName: "",
    nearbyActiveReports: [],
  });

  const [category, setCategory] = useState("LUBANG");
  const [sizeClass, setSizeClass] = useState("SEDANG");
  const [landmark, setLandmark] = useState("");
  const [freeText, setFreeText] = useState("");
  const [observedAt, setObservedAt] = useState("");
  useEffect(() => {
    // datetime-local has no timezone; format the opening time explicitly as WIB (UTC+7).
    setObservedAt(new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16));
  }, []);
  const [contactEmail, setContactEmail] = useState("");

  // State Upload Foto Cloudinary + EXIF
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [photoStatusText, setPhotoStatusText] = useState(
    "Belum ada foto yang diunggah."
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // State Draf & Hash Persetujuan (Human-in-the-Loop F2 & F3)
  const [isSavingFacts, setIsSavingFacts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draft, setDraft] = useState<ReportDraftApiData>({
    draftId: "",
    reportId: "",
    factsHash: "",
    sourceType: "AI",
    permanentLabel: "✨ [Draf Dibantu AI]",
    title: "",
    body: "",
    fallbackNotice: null,
  });

  const [approved, setApproved] = useState(false);
  const [isStaleFromEdit, setIsStaleFromEdit] = useState(false);
  const [apiErrorBanner, updateApiErrorBanner] = useState<string | null>(null);
  const [errorAnnouncement, setErrorAnnouncement] = useState(0);
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const setApiErrorBanner = (message: string | null) => {
    updateApiErrorBanner(message);
    if (message) setErrorAnnouncement(value => value + 1);
  };

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [geoRetry, setGeoRetry] = useState(0);
  const geoPending = geoLoading || (!geoError && (geoInfo.lat !== lat || geoInfo.lng !== lng));

  // Validasi titik otomatis ke Backend PostGIS & Nominatim OSM saat halaman dibuka
  useEffect(() => {
    let cancelled = false;
    setGeoLoading(true);
    setGeoError(false);
    apiFetch<GeoValidateResponse>("/geo/validate-point", {
      method: "POST",
      body: JSON.stringify({ lat, lng }),
    })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setGeoInfo(res.data);
        } else {
          setGeoError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setGeoError(true);
      }).finally(() => { if (!cancelled) setGeoLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lng, geoRetry]);

  // Handler Upload Foto Nyata (Kompresi Klien + Baca EXIF + Cloudinary Signed Upload)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoStatusText("Mengompresi foto & membaca metadata EXIF...");

    try {
      const exifData = await exifr.gps(file).catch(() => null);
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      const signRes = await apiFetch<{
        configured: boolean;
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
      }>("/uploads/cloudinary-sign", { method: "POST", body: JSON.stringify({}) });

      if (!signRes.success || !signRes.data?.configured) throw new Error("Layanan unggah belum tersedia.");
      let cloudinaryPublicId = "";
      let originalSecureUrl = "";

      if (signRes.success && signRes.data?.configured) {
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("api_key", signRes.data.apiKey);
        formData.append("timestamp", String(signRes.data.timestamp));
        formData.append("signature", signRes.data.signature);
        formData.append("folder", signRes.data.folder);

        const cloudUpload = await fetch(
          `https://api.cloudinary.com/v1_1/${signRes.data.cloudName}/image/upload`,
          { method: "POST", body: formData }
        );
        if (!cloudUpload.ok) throw new Error("Unggah foto gagal.");
        if (cloudUpload.ok) {
          const cloudJson = (await cloudUpload.json()) as {
            public_id: string;
            secure_url: string;
          };
          cloudinaryPublicId = cloudJson.public_id;
          originalSecureUrl = cloudJson.secure_url;
        }
      }

      const regRes = await apiFetch<{ photo: { id: string } }>("/uploads/cloudinary-sign", {
        method: "POST",
        body: JSON.stringify({
          registerPhoto: true,
          reportId,
          kind: "REPORT",
          cloudinaryPublicId,
          originalSecureUrl,
          reportLat: lat,
          reportLng: lng,
          exifLat: exifData?.latitude ?? null,
          exifLng: exifData?.longitude ?? null,
        }),
      });

      if (regRes.success && regRes.data?.photo?.id) {
        markFactsModified(() => setPhotoIds([regRes.data!.photo.id]));
      } else { throw new Error("Foto belum tersimpan."); }

      setPhotoPreviewUrl(originalSecureUrl);
      setPhotoStatusText(
        `✓ ${file.name} (${Math.round(compressed.size / 1024)} KB • EXIF ${
          exifData?.latitude ? "Terdeteksi" : "Tidak tersedia"
        })`
      );
    } catch {
      setPhotoStatusText(`Foto ${file.name} belum berhasil diunggah. Silakan coba lagi.`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Menandai perubahan Fakta Asal yang otomatis mereset persetujuan (FR-3.4 / US-05)
  const markFactsModified = (updater: () => void) => {
    updater();
    if (approved || step >= 2) {
      setApproved(false);
      setIsStaleFromEdit(true);
    }
  };

  // Simpan Fakta Asal ke Neon PostgreSQL (POST /v1/reports atau PUT /v1/reports/:id/facts)
  const handleSaveFactsAndGoStep2 = async () => {
    if (isSavingFacts) return;
    if (contactEmail.trim() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) || contactEmail.trim().length > 255)) { setApiErrorBanner("Periksa format email, atau kosongkan jika tidak ingin menerima tiket melalui email."); return; }
    if (!landmark.trim() || photoIds.length === 0) { setApiErrorBanner("Tambahkan foto kerusakan dan isi patokan lokasi terlebih dahulu."); return; }
    if (observedAt && (!Number.isFinite(Date.parse(`${observedAt}+07:00`)) || Date.parse(`${observedAt}+07:00`) > Date.now())) { setApiErrorBanner("Waktu pengamatan tidak valid atau berada di masa depan."); return; }
    setIsSavingFacts(true);
    setApiErrorBanner(null);

    const payload = {
      lat,
      lng,
      gpsAccuracyMeters: locationSource === "GPS" ? gpsAccuracyMeters : null,
      locationSource,
      suggestedStreetName: geoInfo.suggestedStreetName,
      category,
      sizeClass,
      landmark,
      freeText,
      observedAt: observedAt ? new Date(`${observedAt}+07:00`).toISOString() : null,
      impactTags: [],
      photoIds,
      contactEmail: contactEmail || null,
    };

    try {
      let savedReportId = reportId;
      if (!reportId) {
        const res = await apiFetch<{
          reportId: string;
          ticketCode: string;
          factsHash: string;
        }>("/reports", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.success && res.data) {
          savedReportId = res.data.reportId;
          setReportId(res.data.reportId);
          setTicketCode(res.data.ticketCode);
          setDraft((prev) => ({ ...prev, factsHash: res.data!.factsHash }));
        } else { throw new Error(res.error?.detail || "Laporan belum tersimpan. Silakan coba lagi."); }
      } else {
        const res = await apiFetch<{
          reportId: string;
          factsHash: string;
          approvalReset: boolean;
        }>(`/reports/${reportId}/facts`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (res.success && res.data) {
          setDraft((prev) => ({ ...prev, factsHash: res.data!.factsHash }));
          if (res.data.approvalReset) {
            setIsStaleFromEdit(true);
            setApproved(false);
          }
        } else { throw new Error(res.error?.detail || "Perubahan belum tersimpan. Silakan coba lagi."); }
      }
      const draftRes = await apiFetch<ReportDraftApiData>(`/reports/${savedReportId}/drafts/generate`, { method: "POST", body: JSON.stringify({ forceFallback: true }) });
      if (!draftRes.success || !draftRes.data) throw new Error(draftRes.error?.detail || "Data tersimpan, tetapi ringkasan laporan belum dapat disiapkan. Silakan coba lagi.");
      setDraft(draftRes.data);
      setIsStaleFromEdit(false);
      setApproved(false);
      setStep(2);
    } catch (error) {
      setApiErrorBanner(error instanceof Error ? error.message : "Laporan belum tersimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSavingFacts(false);
    }
  };

  // Centang Persetujuan & Kirim Final ke Neon DB (POST /v1/reports/:id/approve & /submit)
  const handleApproveAndSubmitFinal = async () => {
    if (!reportId || !draft.draftId || !approved || isStaleFromEdit) return;
    setIsSubmitting(true);
    setApiErrorBanner(null);

    try {
      if (reportId) {
        const approveRes = await apiFetch(`/reports/${reportId}/approve`, {
          method: "POST",
          body: JSON.stringify({
            draftId: draft.draftId,
            factsHash: draft.factsHash,
          }),
        });

        if (!approveRes.success) {
          setApiErrorBanner(
            approveRes.error?.detail ||
              "Persetujuan ditolak (409 Conflict): Fakta Asal telah berubah!"
          );
          setIsStaleFromEdit(true);
          setApproved(false);
          setIsSubmitting(false);
          return;
        }

        const submitRes = await apiFetch<{
          reportId: string;
          ticketCode: string;
          status: string;
          receiptEmailStatus?: ReceiptEmailStatus;
        }>(`/reports/${reportId}/submit`, {
          method: "POST",
          headers: {
            "Idempotency-Key": `idem_${reportId}_${draft.factsHash.slice(0, 12)}`,
          },
          body: JSON.stringify({
            draftId: draft.draftId,
            approvedFactsHash: draft.factsHash,
          }),
        });

        if (!submitRes.success || !submitRes.data?.ticketCode) {
          setApiErrorBanner(submitRes.error?.detail || "Laporan belum berhasil dikirim. Silakan coba lagi.");
          if (/HASH|STALE|APPROVAL/.test(submitRes.error?.code || "")) {
            setIsStaleFromEdit(true);
            setApproved(false);
          }
          setIsSubmitting(false);
          return;
        }

        if (submitRes.data?.ticketCode) {
          saveTicket(submitRes.data.ticketCode);
          setTicketCode(submitRes.data.ticketCode);
          setReceiptEmailStatus(submitRes.data.receiptEmailStatus || (contactEmail.trim() ? "PENDING" : "NOT_REQUESTED"));
        }
      }
      setStep(3);
    } catch {
      setApiErrorBanner("Laporan belum berhasil dikirim. Periksa koneksi Anda, lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    document.getElementById("report-heading")?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step]);

  useEffect(() => {
    if (!apiErrorBanner) return;
    const frame = requestAnimationFrame(() => {
      const banner = errorBannerRef.current;
      if (!banner) return;
      banner.focus({ preventScroll: true });
      banner.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [apiErrorBanner, errorAnnouncement]);

  const progress = [
    { title: "Isi data laporan", description: "Foto, lokasi, dan kondisi jalan", icon: Camera },
    { title: "Tinjau & kirim", description: "Pastikan laporan sesuai fakta", icon: CheckCircle2 },
  ];

  return (
    <main className="report-page">
      <div className="report-container">
        <Link href="/" className="report-back"><ArrowLeft size={16} aria-hidden="true" />Kembali ke peta</Link>
        <header className="report-heading">
          <h1 id="report-heading">Laporkan jalan rusak</h1>
          <p>Bantu tunjukkan kerusakan jalan di Kota Bogor. Anda bisa melapor tanpa akun.</p>
        </header>
        <div className="report-layout">
          <aside className="report-guide" aria-label="Progres pelaporan">
            <ol className="report-progress">
              {progress.map((item, index) => {
                const number = index + 1;
                const active = Math.min(step, 2) === number;
                const complete = step > number;
                return <li key={item.title} className={active ? "is-current" : complete ? "is-complete" : ""} aria-current={active ? "step" : undefined}>
                  <span className="report-step-number">{complete ? <CheckCircle2 size={19} aria-hidden="true" /> : number}</span>
                  <div><span className="report-step-title">{item.title}</span><p>{item.description}</p></div>
                </li>;
              })}
            </ol>
            <div className="report-guide-note"><ShieldCheck size={20} aria-hidden="true" /><p>Data Anda ditinjau Admin sebelum laporan tampil di peta publik.</p></div>
          </aside>

          <div className="report-content">
            {apiErrorBanner && <div ref={errorBannerRef} tabIndex={-1} className="report-alert report-alert-error report-error-banner" role="alert"><AlertTriangle size={19} aria-hidden="true" /><div><strong>Laporan belum dapat dikirim</strong><p>{apiErrorBanner}</p></div><button type="button" onClick={() => setApiErrorBanner(null)} className="report-text-button">Tutup</button></div>}

            {step === 1 && <div className="report-panel">
              <section className="report-section" aria-labelledby="photo-heading">
                <div className="report-section-heading"><div><h2 id="photo-heading">Foto kerusakan</h2><p>Tambahkan 1 hingga 3 foto yang memperlihatkan kondisi jalan.</p></div><span className="report-required">Wajib</span></div>
                <div className="report-photo-grid">
                  {[1, 2, 3].map((number) => <label key={number} className={`report-photo-slot ${number === 1 ? "report-photo-main" : ""}`}>
                    {number === 1 && photoPreviewUrl ? <img src={photoPreviewUrl} alt="Pratinjau foto kerusakan yang dipilih" className="report-photo-preview" width={320} height={180} /> : <Camera size={number === 1 ? 26 : 22} aria-hidden="true" />}
                    <span>{number === 1 ? isUploadingPhoto ? "Mengunggah foto…" : "Pilih / ganti foto" : `Tambah foto ke-${number}`}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} aria-label={number === 1 ? "Pilih foto kerusakan" : `Tambah foto ke-${number}`} disabled={isUploadingPhoto} />
                  </label>)}
                </div>
                <p className="report-helper" role="status"><Upload size={15} aria-hidden="true" />{photoStatusText}</p>
                <p className="report-helper">Foto dikompresi sebelum diunggah. Gunakan foto Anda sendiri saat membuat laporan.</p>
              </section>

              <section className="report-section" aria-labelledby="location-heading">
                <div className="report-section-heading"><div><h2 id="location-heading">Lokasi kerusakan</h2><p>Pastikan titik laporan berada di dalam wilayah Kota Bogor.</p></div><button type="button" className="report-secondary" onClick={() => {
                    if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          markFactsModified(() => {
                          setLat(Number(pos.coords.latitude.toFixed(6)));
                          setLng(Number(pos.coords.longitude.toFixed(6)));
                          setGpsAccuracyMeters(Math.round(pos.coords.accuracy));
                          setLocationSource("GPS");
                          });
                        },
                        () => {
                          setApiErrorBanner("Lokasi GPS tidak dapat diakses. Klik peta atau geser pin untuk memilih lokasi.");
                        }
                      );
                    }
                  }}><LocateFixed size={16} aria-hidden="true" />Gunakan GPS</button></div>
                <div className="report-location-guide"><Image src="/images/sijago_menunjuk_lokasi.svg" alt="" width={496} height={445} className="report-location-mascot" /><p className="report-helper" id="location-map-help">Klik peta atau geser pin ke lokasi kerusakan. Pin juga dapat dipindahkan dengan tombol panah saat dipilih.</p></div>
                <BogorMap centerLat={lat} centerLng={lng} reports={NO_MAP_REPORTS} onLocationChange={(nextLat, nextLng) => markFactsModified(() => { setLat(nextLat); setLng(nextLng); setLocationSource("MANUAL_PIN"); })} className="report-location-map" />
                <p className="report-helper" role="status">{geoLoading ? "Memeriksa lokasi…" : geoError ? "Alamat dan batas wilayah belum dapat diperiksa. Periksa koneksi lalu coba pilih titik kembali." : "Lokasi telah diperiksa."}</p>
                {!geoInfo.isInsideBogorCity ? <div className="report-alert report-alert-error" role="alert"><AlertTriangle size={18} aria-hidden="true" /><p>Lokasi berada di luar wilayah administratif Kota Bogor. SIJAGO saat ini khusus melayani area Kota Bogor.</p></div> : <div className="report-location-meta"><span><MapPin size={16} aria-hidden="true" />{geoInfo.districtName}</span><span>{lat}, {lng}</span><span>{locationSource === "GPS" ? `Akurasi ±${gpsAccuracyMeters} m` : "Titik dipilih manual"}</span></div>}
                <div className="report-street-suggestion"><div><span>Saran nama jalan</span><p>{geoLoading ? "Mencari alamat…" : geoError ? "Alamat belum tersedia" : geoInfo.suggestedStreetName}</p></div><button disabled={geoLoading || geoError} type="button" onClick={() => markFactsModified(() => setLandmark(geoInfo.suggestedStreetName)) } className="report-text-button">Salin ke patokan</button></div>
                <details className="report-disclosure report-nearby">
                  <summary>Laporan di sekitar titik ini</summary>
                  <div aria-live="polite" aria-busy={geoPending}>
                    {geoPending ? <p>Mencari laporan dalam radius 30 meter…</p> : geoError || geoInfo.nearbyReportsAvailable === false ? <div><p>Laporan sekitar belum dapat diperiksa. Ini bukan berarti tidak ada laporan.</p><button type="button" className="report-text-button" onClick={() => setGeoRetry((value) => value + 1)}>Coba lagi</button></div> : !geoInfo.isInsideBogorCity ? <p>Pencarian laporan tersedia untuk titik di dalam wilayah Kota Bogor.</p> : geoInfo.nearbyActiveReports.length === 0 ? <p>Belum ada laporan aktif yang dapat ditampilkan dalam radius 30 meter dari titik ini.</p> : <>
                      <p>Ditemukan {geoInfo.nearbyActiveReports.length} laporan terdekat dalam radius 30 meter. Periksa apakah kerusakannya sama sebelum membuat laporan baru.</p>
                      <ul className="report-nearby-list">{geoInfo.nearbyActiveReports.map((report) => <li key={report.id}>
                        <strong>{report.ticketCode}</strong>
                        <p>{NEARBY_STATUS_LABELS[report.status] || report.status} · {Number(report.distanceMeters).toLocaleString("id-ID", { maximumFractionDigits: 1 })} m dari titik pilihan</p>
                        <p>{report.districtName} · {report.upvoteCount} dukungan</p>
                        <Link href={`/laporan/${encodeURIComponent(report.id)}`} target="_blank" rel="noopener noreferrer" className="report-text-button">Lihat & dukung laporan <span className="sr-only">{report.ticketCode} (tab baru)</span><ChevronRight size={16} aria-hidden="true" /></Link>
                      </li>)}</ul>
                      <p>Jika titik kerusakan berbeda, Anda tetap dapat melanjutkan laporan ini.</p>
                    </>}
                  </div>
                </details>
              </section>

              <section className="report-section" aria-labelledby="damage-heading">
                <div className="report-section-heading"><div><h2 id="damage-heading">Ceritakan kondisi jalan</h2><p>Isi sesuai yang Anda lihat. Ukuran boleh berupa perkiraan.</p></div></div>
                <div className="report-fields">
                  <div className="report-field"><label htmlFor="damage-category">Kategori kerusakan <span>Wajib</span></label><select id="damage-category" name="category" value={category} onChange={(e) => markFactsModified(() => setCategory(e.target.value))}>
                    <option value="LUBANG">Lubang jalan</option><option value="RETAK">Retak buaya / memanjang</option><option value="AMBLAS">Jalan amblas / penurunan</option><option value="BERGELOMBANG">Permukaan bergelombang</option><option value="GENANGAN_DRAINASE">Genangan air / drainase buruk</option><option value="LAINNYA">Lainnya</option>
                  </select></div>
                  <div className="report-field"><label htmlFor="damage-size">Kelas ukuran <span>Wajib</span></label><select id="damage-size" aria-describedby="damage-size-help" name="sizeClass" value={sizeClass} onChange={(e) => markFactsModified(() => setSizeClass(e.target.value))}>
                    <option value="KECIL">Kecil — kurang dari 30 cm</option><option value="SEDANG">Sedang — 30–100 cm</option><option value="BESAR">Besar — lebih dari 100 cm</option>
                  </select><p id="damage-size-help" className="report-helper">{category === "LUBANG" || category === "AMBLAS" ? { KECIL: "Diameter kurang dari 30 cm dan kedalaman kurang dari 5 cm.", SEDANG: "Diameter 30–100 cm atau kedalaman 5–15 cm.", BESAR: "Diameter lebih dari 100 cm atau kedalaman lebih dari 15 cm." }[sizeClass] : { KECIL: "Bagian jalan yang terdampak kurang dari 30 cm.", SEDANG: "Bagian jalan yang terdampak sepanjang 30–100 cm.", BESAR: "Bagian jalan yang terdampak lebih dari 100 cm." }[sizeClass]} Pilih kelas terbesar jika perkiraan diameter dan kedalaman berbeda. Perkirakan dari tempat aman. Tidak perlu mengukur langsung.</p></div>
                  <div className="report-field report-span-full"><label htmlFor="damage-landmark">Patokan lokasi <span>Wajib</span></label><input id="damage-landmark" name="landmark" type="text" value={landmark} onChange={(e) => markFactsModified(() => setLandmark(e.target.value))} /><p className="report-helper">Misalnya di depan gerbang, dekat persimpangan, atau arah lajur.</p></div>
                  <div className="report-field report-span-full"><label htmlFor="observed-at">Waktu pengamatan <span>Opsional</span></label><input id="observed-at" type="datetime-local" value={observedAt} onChange={(e) => markFactsModified(() => setObservedAt(e.target.value))} /><p className="report-helper">Waktu Anda melihat kerusakan, dalam WIB. Kosongkan jika tidak ingat.</p></div>
                  <div className="report-field report-span-full"><label htmlFor="damage-description">Kondisi di lapangan</label><textarea id="damage-description" name="freeText" rows={4} maxLength={1000} value={freeText} onChange={(e) => markFactsModified(() => setFreeText(e.target.value))} /><p className="report-helper">Maksimal 1.000 karakter.</p></div>
                  <div className="report-field report-span-full"><label htmlFor="reporter-email">Email untuk notifikasi <span>Opsional</span></label><input id="reporter-email" name="contactEmail" type="email" autoComplete="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="nama@email.com" /><p className="report-helper"><Lock size={14} aria-hidden="true" />Tiket dan tautan pelacakan dikirim ke email ini. Identitas & email Anda tidak akan diteruskan ke instansi dan tidak ditampilkan ke publik.</p></div>
                </div>
              </section>
              <div className="report-action-bar"><span className="report-helper">{reportId ? `Data laporan tersimpan (${ticketCode})` : ""}</span><button type="button" disabled={geoLoading || geoError || !geoInfo.isInsideBogorCity || isSavingFacts} onClick={handleSaveFactsAndGoStep2} className="report-primary">{isSavingFacts ? "Menyiapkan laporan…" : "Tinjau & kirim"}<ChevronRight size={17} aria-hidden="true" /></button></div>
            </div>}

            {step === 2 && <div className="report-panel">
              <section className="report-section report-review-intro"><h2>Tinjau sebelum mengirim</h2><p>Cocokkan draf dengan data Anda. Untuk mengubah isinya, kembali ke data laporan.</p></section>
              {isStaleFromEdit && <div className="report-alert report-alert-warning" role="alert"><AlertTriangle size={19} aria-hidden="true" /><div><strong>Persetujuan dibatalkan karena data berubah</strong><p>Data Fakta Asal Anda telah berubah. Persetujuan sebelumnya dibatalkan otomatis. Silakan kembali ke data laporan, simpan, dan tinjau ulang sebelum mengirim.</p></div><button type="button" onClick={() => setStep(1)} className="report-secondary"><RefreshCw size={16} aria-hidden="true" />Kembali ke data</button></div>}
              {draft.fallbackNotice && <div className="report-alert report-alert-neutral"><FileText size={18} aria-hidden="true" /><p>{draft.fallbackNotice}</p></div>}
              <div className="report-review-columns">
                <section className="report-review-facts"><h3>Fakta Asal Anda</h3><dl>
                  <div><dt>Kategori & ukuran</dt><dd>{category}, kelas {sizeClass.toLowerCase()}</dd></div>
                  <div><dt>Lokasi</dt><dd>{lat}, {lng} ({geoInfo.districtName})</dd></div>
                  <div><dt>Patokan lokasi</dt><dd>{landmark}</dd></div>
                  <div><dt>Waktu pengamatan</dt><dd>{observedAt ? `${observedAt.replace("T", " ")} WIB` : "Tidak diisi"}</dd></div>
                  <div><dt>Kondisi di lapangan</dt><dd>{freeText}</dd></div>
                </dl></section>
                <section className="report-review-draft"><div className="report-review-title"><h3>Draf laporan</h3></div><p className="report-helper">Baca saja. Ubah data asal untuk memperbarui draf.</p><h4>{draft.title}</h4><ReportDescription description={draft.description} fallbackBody={draft.body} /><button type="button" onClick={() => setStep(1)} className="report-text-button">Ingin ubah isi? Edit Fakta Asal</button></section>
              </div>
              <div className="report-approval"><label className="report-checkbox"><input type="checkbox" disabled={isStaleFromEdit} checked={approved} onChange={(e) => setApproved(e.target.checked)} /><span>Saya sudah meninjau dan menyetujui draf ini. Saya menyatakan bahwa data Fakta Asal yang dilaporkan sesuai dengan kondisi nyata di lapangan.</span></label></div>
              <div className="report-action-bar"><button type="button" onClick={() => setStep(1)} className="report-text-button"><ArrowLeft size={16} aria-hidden="true" />Ubah Fakta Asal</button><button type="button" disabled={!approved || isStaleFromEdit || isSubmitting} onClick={handleApproveAndSubmitFinal} className="report-primary">{!approved || isStaleFromEdit ? <Lock size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}{isSubmitting ? "Mengirim laporan…" : "Kirim laporan"}</button></div>
            </div>}

            {step === 3 && <section className="report-panel report-success" aria-labelledby="success-heading"><Image src="/images/sijago_pose_menyapa.svg" alt="" width={462} height={445} className="report-success-mascot" /><h2 id="success-heading">Laporan Anda sudah terkirim</h2><p>Laporan masuk ke antrean verifikasi Admin. Simpan kode tiket untuk memantau perkembangannya.</p><TicketReceipt ticketCode={ticketCode} emailStatus={receiptEmailStatus} /></section>}
          </div>
        </div>
        <p className="report-bottom-note"><CircleHelp size={16} aria-hidden="true" />SIJAGO membantu pelaporan. Waktu perbaikan fisik menjadi kewenangan instansi terkait.</p>
      </div>
    </main>
  );
}
