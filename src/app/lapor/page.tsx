"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./lapor.css";
import imageCompression from "browser-image-compression";
import exifr from "exifr";
import { BogorMap } from "@/components/map/BogorMap";
import { apiFetch } from "@/lib/api";
import {
  Camera,
  MapPin,
  Sparkles,
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

interface GeoValidateResponse {
  isInsideBogorCity: boolean;
  lat: number;
  lng: number;
  districtName: string;
  subdistrictName: string;
  suggestedStreetName: string;
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const previousStep = useRef(step);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // State ID Laporan di Neon PostgreSQL
  const [reportId, setReportId] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState<string>("SJG-2026-1042");

  // State Fakta Asal (Source of Truth)
  const [lat, setLat] = useState(-6.597147);
  const [lng, setLng] = useState(106.806039);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState(8.4);
  const [locationSource, setLocationSource] = useState<"GPS" | "MANUAL_PIN">("GPS");
  const [geoInfo, setGeoInfo] = useState<GeoValidateResponse>({
    isInsideBogorCity: true,
    lat: -6.597147,
    lng: 106.806039,
    districtName: "Bogor Tengah",
    subdistrictName: "Paledang",
    suggestedStreetName: "Jl. Ir. H. Juanda, Paledang, Bogor Tengah, Kota Bogor",
    nearbyActiveReports: [],
  });

  const [category, setCategory] = useState("LUBANG");
  const [sizeClass, setSizeClass] = useState("SEDANG");
  const [sizeLengthCm, setSizeLengthCm] = useState("80");
  const [sizeWidthCm, setSizeWidthCm] = useState("60");
  const [sizeDepthCm, setSizeDepthCm] = useState("12");
  const [landmark, setLandmark] = useState(
    "Depan Pintu 1 Kebun Raya Bogor, Jl. Ir. H. Juanda lajur kiri arah BTM"
  );
  const [freeText, setFreeText] = useState(
    "Lubang cukup dalam dan sering tertutup genangan air saat hujan sore, kemarin ada pemotor hampir jatuh."
  );
  const [contactEmail, setContactEmail] = useState("");
  const [outsideBogorSim, setOutsideBogorSim] = useState(false);

  // State Upload Foto Cloudinary + EXIF
  const [photoIds, setPhotoIds] = useState<string[]>(["seed-photo-juanda-01"]);
  const [photoStatusText, setPhotoStatusText] = useState(
    "Foto contoh: foto_lubang_juanda_1.jpg"
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // State Draf & Hash Persetujuan (Human-in-the-Loop F2 & F3)
  const [isSavingFacts, setIsSavingFacts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forceFallbackSim, setForceFallbackSim] = useState(false);

  const [draft, setDraft] = useState<ReportDraftApiData>({
    draftId: "draft_demo_01",
    reportId: "rep_demo_01",
    factsHash: "hash_v1_8f92a1c4b5d6",
    sourceType: "AI",
    permanentLabel: "✨ [Draf Dibantu AI]",
    title: "Lubang Jalan Berukuran 80x60x12 cm di Depan Pintu 1 Kebun Raya Bogor",
    body: "Dilaporkan kerusakan jalan kategori lubang berukuran panjang 80 cm, lebar 60 cm, dan kedalaman 12 cm (kelas sedang) dengan patokan di depan Pintu 1 Kebun Raya Bogor, Jl. Ir. H. Juanda lajur kiri arah BTM. Kondisi lubang tertutup genangan air saat hujan sore serta berdampak membahayakan pengendara roda dua dan menimbulkan kemacetan.",
    fallbackNotice: null,
  });

  const [approved, setApproved] = useState(false);
  const [isStaleFromEdit, setIsStaleFromEdit] = useState(false);
  const [apiErrorBanner, setApiErrorBanner] = useState<string | null>(null);

  // Validasi titik otomatis ke Backend PostGIS & Nominatim OSM saat halaman dibuka
  useEffect(() => {
    apiFetch<GeoValidateResponse>("/geo/validate-point", {
      method: "POST",
      body: JSON.stringify({ lat, lng }),
    })
      .then((res) => {
        if (res.success && res.data) {
          setGeoInfo(res.data);
        }
      })
      .catch(() => {
        // Gunakan nilai default lokal jika server belum menyala
      });
  }, [lat, lng]);

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

      let cloudinaryPublicId = `local_${Date.now()}_${file.name}`;
      let originalSecureUrl = URL.createObjectURL(compressed);

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
          exifLat: exifData?.latitude ?? lat,
          exifLng: exifData?.longitude ?? lng,
        }),
      });

      if (regRes.success && regRes.data?.photo?.id) {
        markFactsModified(() => setPhotoIds([regRes.data!.photo.id]));
      }

      setPhotoPreviewUrl(originalSecureUrl);
      setPhotoStatusText(
        `✓ ${file.name} (${Math.round(compressed.size / 1024)} KB • EXIF ${
          exifData?.latitude ? "Terdeteksi" : "Default GPS"
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
    setIsSavingFacts(true);
    setApiErrorBanner(null);

    const payload = {
      lat,
      lng,
      gpsAccuracyMeters,
      locationSource,
      suggestedStreetName: geoInfo.suggestedStreetName,
      category,
      sizeClass,
      sizeLengthCm: Number(sizeLengthCm),
      sizeWidthCm: Number(sizeWidthCm),
      sizeDepthCm: Number(sizeDepthCm),
      landmark,
      freeText,
      impactTags: ["MEMBAHAYAKAN_RODA_DUA", "MENIMBULKAN_MACET"],
      photoIds,
      contactEmail: contactEmail || null,
    };

    try {
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
          setReportId(res.data.reportId);
          setTicketCode(res.data.ticketCode);
          setDraft((prev) => ({ ...prev, factsHash: res.data!.factsHash }));
        }
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
        }
      }
    } catch {
      // Tetap izinkan navigasi jika sedang diuji tanpa backend
    } finally {
      setIsSavingFacts(false);
      setStep(2);
    }
  };

  // Panggil OpenAI `gpt-6-luna` (reasoning medium) / Fallback Template & simpan ke Neon DB
  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    setApiErrorBanner(null);
    try {
      if (reportId) {
        const res = await apiFetch<ReportDraftApiData>(
          `/reports/${reportId}/drafts/generate`,
          {
            method: "POST",
            body: JSON.stringify({ forceFallback: forceFallbackSim }),
          }
        );
        if (res.success && res.data) {
          setDraft(res.data);
          setIsStaleFromEdit(false);
          setApproved(false);
          setStep(3);
          setIsGenerating(false);
          return;
        }
      }
    } catch {
      // Fallback preview
    }

    // Jika reportId belum ada, gunakan endpoint preview atau lokal
    if (forceFallbackSim) {
      setDraft({
        draftId: `draft_tpl_${Date.now()}`,
        reportId: reportId ?? "rep_local",
        factsHash: draft.factsHash,
        sourceType: "TEMPLATE",
        permanentLabel: "📄 [Draf Template]",
        title: `[${category} - ${sizeClass}] Kerusakan Jalan di ${landmark.slice(0, 38)}...`,
        body: `Dilaporkan kerusakan jalan kategori ${category.toLowerCase()} dengan kelas ukuran ${sizeClass.toLowerCase()} (panjang ${sizeLengthCm} cm, lebar ${sizeWidthCm} cm, kedalaman ${sizeDepthCm} cm). Patokan lokasi berada di ${landmark}. Catatan lapangan: ${freeText}`,
        fallbackNotice:
          "Layanan perapi teks AI sedang sibuk. Sistem otomatis menyusun draf menggunakan format baku agar Anda dapat langsung melanjutkan laporan.",
      });
    } else {
      setDraft({
        draftId: `draft_ai_${Date.now()}`,
        reportId: reportId ?? "rep_local",
        factsHash: draft.factsHash,
        sourceType: "AI",
        permanentLabel: "✨ [Draf Dibantu AI]",
        title: `Kerusakan ${category} (${sizeLengthCm}x${sizeWidthCm}x${sizeDepthCm} cm) di ${landmark.slice(0, 32)}`,
        body: `Dilaporkan kerusakan jalan kategori ${category.toLowerCase()} berukuran panjang ${sizeLengthCm} cm, lebar ${sizeWidthCm} cm, dan kedalaman ${sizeDepthCm} cm (kelas ${sizeClass.toLowerCase()}) dengan patokan di ${landmark}. ${freeText}`,
        fallbackNotice: null,
      });
    }

    setIsStaleFromEdit(false);
    setApproved(false);
    setIsGenerating(false);
    setStep(3);
  };

  // Simulasi perubahan Fakta Asal langsung dari Step 3 yang memicu invalidasi di Neon DB
  const handleSimulateFactChangeInStep3 = async () => {
    const newDepth = sizeDepthCm === "12" ? "22" : "12";
    setSizeDepthCm(newDepth);
    setApproved(false);
    setIsStaleFromEdit(true);

    if (reportId) {
      await apiFetch(`/reports/${reportId}/facts`, {
        method: "PUT",
        body: JSON.stringify({
          lat,
          lng,
          gpsAccuracyMeters,
          locationSource,
          category,
          sizeClass,
          sizeLengthCm: Number(sizeLengthCm),
          sizeWidthCm: Number(sizeWidthCm),
          sizeDepthCm: Number(newDepth),
          landmark,
          freeText,
          impactTags: ["MEMBAHAYAKAN_RODA_DUA", "MENIMBULKAN_MACET"],
          photoIds,
        }),
      }).catch(() => null);
    }
  };

  // Centang Persetujuan & Kirim Final ke Neon DB (POST /v1/reports/:id/approve & /submit)
  const handleApproveAndSubmitFinal = async () => {
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

        if (!submitRes.success) {
          setApiErrorBanner(
            submitRes.error?.detail ||
              "Pengiriman ditolak server (409 Conflict): Hash Fakta tidak cocok!"
          );
          setIsStaleFromEdit(true);
          setApproved(false);
          setIsSubmitting(false);
          return;
        }

        if (submitRes.data?.ticketCode) {
          setTicketCode(submitRes.data.ticketCode);
        }
      }
      setStep(4);
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

  const isDemo = !reportId;
  const progress = [
    { title: "Isi data laporan", description: "Foto, lokasi, dan kondisi jalan", icon: Camera },
    { title: "Susun draf", description: "Rapikan teks dari data Anda", icon: FileText },
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
                const active = Math.min(step, 3) === number;
                const complete = step > number;
                return <li key={item.title} className={active ? "is-current" : complete ? "is-complete" : ""} aria-current={active ? "step" : undefined}>
                  <span className="report-step-number">{complete ? <CheckCircle2 size={19} aria-hidden="true" /> : number}</span>
                  <div><span className="report-step-title">{item.title}</span><p>{item.description}</p></div>
                </li>;
              })}
            </ol>
            <div className="report-guide-note"><ShieldCheck size={20} aria-hidden="true" /><p>Data Anda ditinjau Admin sebelum laporan tampil di peta publik.</p></div>
            <details className="report-demo-controls">
              <summary>Pratinjau & pengujian demo</summary>
              <p>Buka contoh setiap tahap tanpa mengirim laporan.</p>
              <div className="report-demo-steps">{[1, 2, 3, 4].map((s) => <button key={s} type="button" onClick={() => setStep(s as 1 | 2 | 3 | 4)} aria-pressed={step === s}>Step {s}</button>)}</div>
              <p>Isian awal memakai contoh data Jalan Juanda dan dapat diganti.</p>
            </details>
          </aside>

          <div className="report-content">
            {apiErrorBanner && <div className="report-alert report-alert-error" role="alert"><AlertTriangle size={19} aria-hidden="true" /><div><strong>Laporan belum dapat dikirim</strong><p>{apiErrorBanner}</p></div><button type="button" onClick={() => setApiErrorBanner(null)} className="report-text-button">Tutup</button></div>}

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
                          setLat(Number(pos.coords.latitude.toFixed(6)));
                          setLng(Number(pos.coords.longitude.toFixed(6)));
                          setGpsAccuracyMeters(Math.round(pos.coords.accuracy));
                          setLocationSource("GPS");
                        },
                        () => {
                          setLocationSource("MANUAL_PIN");
                        }
                      );
                    }
                  }}><LocateFixed size={16} aria-hidden="true" />Gunakan GPS</button></div>
                <BogorMap centerLat={lat} centerLng={lng} className="report-location-map" />
                {outsideBogorSim || !geoInfo.isInsideBogorCity ? <div className="report-alert report-alert-error" role="alert"><AlertTriangle size={18} aria-hidden="true" /><p>Lokasi berada di luar wilayah administratif Kota Bogor. SIJAGO saat ini khusus melayani area Kota Bogor.</p></div> : <div className="report-location-meta"><span><MapPin size={16} aria-hidden="true" />{geoInfo.districtName}</span><span>{lat}, {lng}</span><span>Akurasi ±{gpsAccuracyMeters} m</span></div>}
                <div className="report-street-suggestion"><div><span>Saran nama jalan</span><p>{geoInfo.suggestedStreetName}</p></div><button type="button" onClick={() => markFactsModified(() => setLandmark(geoInfo.suggestedStreetName)) } className="report-text-button">Salin ke patokan</button></div>
                <details className="report-disclosure"><summary>Contoh laporan di sekitar titik ini</summary><div><p>Tiket SJG-2026-1042: Lubang Jalan Berukuran 80x60x12 cm di Depan Pintu 1 Kebun Raya Bogor. Laporan contoh ini memiliki 24 dukungan dan ditampilkan untuk simulasi pemeriksaan radius 30 meter.</p><Link href="/laporan/SJG-2026-1042" className="report-text-button">Dukung (+1) laporan ini</Link><p>Anda tetap dapat melanjutkan jika kerusakan berada di titik yang berbeda.</p></div></details>
                <details className="report-demo-controls"><summary>Pengujian batas wilayah</summary><button type="button" onClick={() => setOutsideBogorSim((v) => !v)} className="report-secondary">{outsideBogorSim ? "Matikan simulasi luar Bogor" : "Simulasi lokasi di luar Bogor"}</button></details>
              </section>

              <section className="report-section" aria-labelledby="damage-heading">
                <div className="report-section-heading"><div><h2 id="damage-heading">Ceritakan kondisi jalan</h2><p>Isi sesuai yang Anda lihat. Ukuran boleh berupa perkiraan.</p></div></div>
                <div className="report-fields">
                  <div className="report-field"><label htmlFor="damage-category">Kategori kerusakan <span>Wajib</span></label><select id="damage-category" name="category" value={category} onChange={(e) => markFactsModified(() => setCategory(e.target.value))}>
                    <option value="LUBANG">Lubang jalan</option><option value="RETAK">Retak buaya / memanjang</option><option value="AMBLAS">Jalan amblas / penurunan</option><option value="BERGELOMBANG">Permukaan bergelombang</option><option value="GENANGAN_DRAINASE">Genangan air / drainase buruk</option><option value="LAINNYA">Lainnya</option>
                  </select></div>
                  <div className="report-field"><label htmlFor="damage-size">Kelas ukuran <span>Wajib</span></label><select id="damage-size" aria-describedby="damage-size-help" name="sizeClass" value={sizeClass} onChange={(e) => markFactsModified(() => setSizeClass(e.target.value))}>
                    <option value="KECIL">Kecil</option><option value="SEDANG">Sedang</option><option value="BESAR">Besar</option>
                  </select><p id="damage-size-help" className="report-helper">{{ KECIL: "Diameter di bawah 30 cm, dangkal.", SEDANG: "Ukuran 30 hingga 100 cm, kedalaman 5 hingga 15 cm.", BESAR: "Ukuran di atas 100 cm atau kedalaman di atas 15 cm." }[sizeClass]}</p></div>
                  <div className="report-dimensions report-span-full">
                    <div className="report-field"><label htmlFor="damage-length">Panjang (cm)</label><input id="damage-length" name="sizeLengthCm" type="number" value={sizeLengthCm} onChange={(e) => markFactsModified(() => setSizeLengthCm(e.target.value))} /></div>
                    <div className="report-field"><label htmlFor="damage-width">Lebar (cm)</label><input id="damage-width" name="sizeWidthCm" type="number" value={sizeWidthCm} onChange={(e) => markFactsModified(() => setSizeWidthCm(e.target.value))} /></div>
                    <div className="report-field"><label htmlFor="damage-depth">Kedalaman (cm)</label><input id="damage-depth" name="sizeDepthCm" type="number" value={sizeDepthCm} onChange={(e) => markFactsModified(() => setSizeDepthCm(e.target.value))} /></div>
                  </div>
                  <div className="report-field report-span-full"><label htmlFor="damage-landmark">Patokan lokasi <span>Wajib</span></label><input id="damage-landmark" name="landmark" type="text" value={landmark} onChange={(e) => markFactsModified(() => setLandmark(e.target.value))} /><p className="report-helper">Misalnya di depan gerbang, dekat persimpangan, atau arah lajur.</p></div>
                  <div className="report-field report-span-full"><label htmlFor="damage-description">Kondisi di lapangan</label><textarea id="damage-description" name="freeText" rows={4} maxLength={1000} value={freeText} onChange={(e) => markFactsModified(() => setFreeText(e.target.value))} /><p className="report-helper">Maksimal 1.000 karakter.</p></div>
                  <div className="report-field report-span-full"><label htmlFor="reporter-email">Email untuk notifikasi <span>Opsional</span></label><input id="reporter-email" name="contactEmail" type="email" autoComplete="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="nama@email.com" /><p className="report-helper"><Lock size={14} aria-hidden="true" />Identitas & email Anda tidak akan diteruskan ke instansi dan tidak ditampilkan ke publik.</p></div>
                </div>
              </section>
              <div className="report-action-bar"><span className="report-helper">{reportId ? `Data laporan tersimpan (${ticketCode})` : "Isian contoh dapat digunakan untuk pratinjau."}</span><button type="button" disabled={outsideBogorSim || !geoInfo.isInsideBogorCity || isSavingFacts} onClick={handleSaveFactsAndGoStep2} className="report-primary">{isSavingFacts ? "Menyimpan data…" : "Lanjut ke draf"}<ChevronRight size={17} aria-hidden="true" /></button></div>
            </div>}

            {step === 2 && <section className="report-panel report-draft-stage" aria-labelledby="draft-heading">
              <div className="report-section"><FileText size={28} className="report-accent-icon" aria-hidden="true" /><h2 id="draft-heading">Susun draf laporan Anda</h2><p className="report-lead">Data sudah siap. Kami akan merapikan isian Anda menjadi judul dan deskripsi laporan.</p>
                <ul className="report-explanation"><li><CheckCircle2 size={17} aria-hidden="true" />Angka, ukuran, dan lokasi tetap mengikuti data Anda.</li><li><CheckCircle2 size={17} aria-hidden="true" />Anda meninjau dan menyetujui draf sebelum mengirim.</li><li><CheckCircle2 size={17} aria-hidden="true" />Jika AI tidak tersedia, draf memakai template baku.</li></ul>
                {isDemo && <p className="report-demo-notice">Mode pratinjau: backend belum menyimpan laporan ini. Draf lokal hanya untuk simulasi.</p>}
                <details className="report-demo-controls"><summary>Pengujian fallback template</summary><p>Gunakan opsi ini untuk menguji draf template ketika AI tidak tersedia.</p><label className="report-checkbox"><input type="checkbox" checked={forceFallbackSim} onChange={(e) => setForceFallbackSim(e.target.checked)} />Simulasikan AI Fallback ke Draf Template</label></details>
              </div>
              <div className="report-action-bar"><button type="button" onClick={() => setStep(1)} className="report-text-button"><ArrowLeft size={16} aria-hidden="true" />Kembali ke data</button><button type="button" disabled={isGenerating} onClick={handleGenerateDraft} className="report-primary"><Sparkles size={17} aria-hidden="true" />{isGenerating ? "Menyusun draf…" : "Buat draf laporan"}</button></div>
            </section>}

            {step === 3 && <div className="report-panel">
              <section className="report-section report-review-intro"><h2>Tinjau sebelum mengirim</h2><p>Cocokkan draf dengan data Anda. Untuk mengubah isinya, kembali ke data laporan.</p></section>
              {isStaleFromEdit && <div className="report-alert report-alert-warning" role="alert"><AlertTriangle size={19} aria-hidden="true" /><div><strong>Persetujuan dibatalkan karena data berubah</strong><p>Data Fakta Asal Anda telah berubah. Persetujuan sebelumnya dibatalkan otomatis. Silakan tekan 'Perbarui Draf' dan tinjau ulang sebelum mengirim.</p></div><button type="button" onClick={handleGenerateDraft} className="report-secondary"><RefreshCw size={16} aria-hidden="true" />Perbarui draf</button></div>}
              {draft.fallbackNotice && <div className="report-alert report-alert-neutral"><FileText size={18} aria-hidden="true" /><p>{draft.fallbackNotice}</p></div>}
              {isDemo && <p className="report-demo-notice">Draf ini merupakan pratinjau lokal. Belum ada laporan yang dikirim ke server.</p>}
              <div className="report-review-columns">
                <section className="report-review-facts"><h3>Fakta Asal Anda</h3><dl>
                  <div><dt>Kategori & ukuran</dt><dd>{category}, kelas {sizeClass} ({sizeLengthCm} × {sizeWidthCm} × {sizeDepthCm} cm)</dd></div>
                  <div><dt>Lokasi</dt><dd>{lat}, {lng} ({geoInfo.districtName})</dd></div>
                  <div><dt>Patokan lokasi</dt><dd>{landmark}</dd></div>
                  <div><dt>Kondisi di lapangan</dt><dd>{freeText}</dd></div>
                </dl><details className="report-demo-controls"><summary>Riwayat teknis & pengujian</summary><p>SHA-256 Facts Hash: <code>{draft.factsHash}</code></p><button type="button" onClick={handleSimulateFactChangeInStep3} className="report-secondary">Simulasi ubah fakta</button></details></section>
                <section className="report-review-draft"><div className="report-review-title"><h3>Draf laporan</h3><span className={`report-draft-badge ${draft.sourceType === "AI" ? "report-draft-ai" : ""}`}>{draft.permanentLabel}</span></div><p className="report-helper">Baca saja. Ubah data asal untuk memperbarui draf.</p><h4>{draft.title}</h4><p className="report-draft-body">{draft.body}</p><button type="button" onClick={() => setStep(1)} className="report-text-button">Ingin ubah isi? Edit Fakta Asal</button></section>
              </div>
              <div className="report-approval"><label className="report-checkbox"><input type="checkbox" disabled={isStaleFromEdit} checked={approved} onChange={(e) => setApproved(e.target.checked)} /><span>Saya sudah meninjau dan menyetujui draf ini. Saya menyatakan bahwa data Fakta Asal yang dilaporkan sesuai dengan kondisi nyata di lapangan (FR-3.2).</span></label></div>
              <div className="report-action-bar"><button type="button" onClick={() => setStep(1)} className="report-text-button"><ArrowLeft size={16} aria-hidden="true" />Ubah Fakta Asal</button><button type="button" disabled={!approved || isStaleFromEdit || isSubmitting} onClick={handleApproveAndSubmitFinal} className="report-primary">{!approved || isStaleFromEdit ? <Lock size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}{isSubmitting ? "Mengirim laporan…" : isDemo ? "Simulasikan pengiriman" : "Kirim laporan"}</button></div>
            </div>}

            {step === 4 && <section className="report-panel report-success" aria-labelledby="success-heading"><CheckCircle2 size={36} className="report-success-icon" aria-hidden="true" /><h2 id="success-heading">{isDemo ? "Pratinjau pelaporan selesai" : "Laporan Anda sudah terkirim"}</h2><p>{isDemo ? "Ini adalah simulasi. Belum ada laporan baru yang tercatat di server." : "Laporan masuk ke antrean verifikasi Admin. Simpan kode tiket untuk memantau perkembangannya."}</p><div className="report-ticket"><span>{isDemo ? "Contoh kode tiket" : "Kode tiket Anda"}</span><strong>{ticketCode}</strong><span>{isDemo ? "Status contoh: Menunggu verifikasi" : "Status: Menunggu verifikasi"}</span></div><div className="report-success-actions"><Link href={`/lacak?kode=${ticketCode}`} className="report-primary">Lacak tiket</Link><Link href="/admin/audit" className="report-secondary">Lihat jejak audit</Link></div></section>}
          </div>
        </div>
        <p className="report-bottom-note"><CircleHelp size={16} aria-hidden="true" />SIJAGO membantu pelaporan. Waktu perbaikan fisik menjadi kewenangan instansi terkait.</p>
      </div>
    </main>
  );
}
