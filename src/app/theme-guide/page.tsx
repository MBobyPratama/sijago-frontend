"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./theme-guide.css";
import { Copy, ThumbsUp } from "lucide-react";

const BRAND_COLORS = [
  {role:"Identitas utama",name:"Bogor Rain Blue",hex:"#1E40AF",token:"--color-accent",tailwindBg:"bg-sijago-primary",usage:"Aksi utama, pilihan aktif, dan fokus keyboard."},
  {role:"Kepercayaan warga",name:"Botanical Emerald",hex:"#059669",token:"--color-civic",tailwindBg:"bg-sijago-civic",usage:"Penanda keberhasilan dan hasil perbaikan. Teks memakai --color-civic-ink."},
  {role:"Asal draf",name:"Luna Indigo",hex:"#4F46E5",token:"--color-ai",tailwindBg:"bg-sijago-ai",usage:"Informasi bantuan AI. Teks memakai --color-ai-ink, bukan tombol utama kedua."},
  {role:"Latar halaman",name:"Paper",hex:"#F5F7FA",token:"--color-paper",tailwindBg:"var(--color-paper)",usage:"Latar tenang untuk halaman warga."},
  {role:"Permukaan",name:"Paper 3",hex:"#FFFFFF",token:"--color-paper-3",tailwindBg:"var(--color-paper-3)",usage:"Input, panel peta, dialog, dan bidang informasi."},
  {role:"Teks utama",name:"Ink",hex:"#172C43",token:"--color-ink",tailwindBg:"var(--color-ink)",usage:"Judul dan isi. Teks pendamping memakai --color-muted (#52667B)."},
  {role:"Draf template",name:"Slate Neutral",hex:"#475569",token:"--guide-fallback",tailwindBg:"bg-slate-600",usage:"Referensi warna fallback dari sijago-docs. Label warga memakai pasangan ink netral agar tetap terbaca."},
  {role:"Peringatan",name:"Amber Alert",hex:"#D97706",token:"--guide-waiting",tailwindBg:"bg-amber-600",usage:"Peringatan dan referensi antrean verifikasi internal; bukan warna teks pada latar terang."},
];
const MAP_MARKER_TOKENS = [
  {status:"Menunggu verifikasi",token:"--guide-waiting",hex:"#D97706",desc:"Antrean internal; belum tampil di peta publik."},
  {status:"Terverifikasi",token:"--color-verified",hex:"#2563EB",desc:"Laporan valid dan dapat tampil di peta publik."},
  {status:"Diteruskan",token:"--color-forwarded",hex:"#7C3AED",desc:"Laporan diteruskan kepada instansi berwenang."},
  {status:"Diproses",token:"--color-progress",hex:"#EA580C",desc:"Instansi sedang menangani laporan."},
  {status:"Selesai",token:"--color-complete",hex:"#16A34A",desc:"Perbaikan selesai; hasilnya masuk masa pemantauan."},
  {status:"Dibuka kembali",token:"--color-reopened",hex:"#DC2626",desc:"Ambang penilaian cepat rusak tercapai."},
  {status:"Ditutup",token:"--color-closed",hex:"#64748B",desc:"Masa pemantauan selesai."},
  {status:"Ditolak",token:"--color-closed",hex:"#64748B",desc:"Laporan ditolak saat moderasi."},
];
const TYPOGRAPHY_SCALE = [
  {token:"Judul beranda",spec:"32–54 px / 1.18 / 700",tailwind:"clamp(32px, 4.2vw, 54px)",sample:"Jalan baik, aktivitas lancar.",kind:"hero"},
  {token:"Judul Lapor dan Lacak",spec:"32 px / 1.25 / 700",tailwind:"font-size: 32px",sample:"Laporkan jalan rusak",kind:"page"},
  {token:"Judul detail laporan",spec:"27.648 px / 1.3 / 700",tailwind:"var(--text-2xl)",sample:"Kondisi jalan di lingkungan Anda",kind:"detail"},
  {token:"Judul bagian",spec:"19.2 px / 1.4 / 700",tailwind:"var(--text-lg)",sample:"Bagaimana hasil perbaikannya?",kind:"section"},
  {token:"Isi utama",spec:"16 px / 1.6 / 400",tailwind:"var(--text-md)",sample:"Pantau kondisi jalan dan perkembangan penanganan laporan Anda.",kind:"body"},
  {token:"Label dan informasi pendamping",spec:"14 px / 1.6 / 400–600",tailwind:"var(--text-sm)",sample:"Kecamatan / Kelurahan",kind:"label"},
  {token:"Metadata ringkas",spec:"12 px / 1.6 / 400–600",tailwind:"var(--text-xs)",sample:"SJG-2026-1042",kind:"meta"},
];

const MANDATORY_MICROCOPY = [
  {
    context: "Badge Permanen Draf AI (FR-2.7)",
    copy: "✨ [Draf Dibantu AI]",
    rule: "Wajib tampil permanen di peta publik, detail laporan, email eskalasi, dan lembar PDF jika disusun oleh gpt-6-luna.",
  },
  {
    context: "Badge Permanen Draf Fallback (FR-2.7)",
    copy: "📄 [Draf Template]",
    rule: "Wajib tampil permanen jika disusun oleh template deterministik (saat AI sibuk/timeout atau angka gagal validasi).",
  },
  {
    context: "Checkbox Persetujuan Warga (FR-3.2)",
    copy: "Saya sudah meninjau dan menyetujui bahwa draf ini sesuai dengan kondisi sebenarnya di lapangan.",
    rule: "Tombol Kirim Laporan wajib terkunci (disabled) sampai checkbox ini dicentang oleh pelapor.",
  },
  {
    context: "Banner Invalidasi Hash Fakta Asal (FR-3.4)",
    copy: "Data Fakta Asal Anda telah berubah. Persetujuan sebelumnya dibatalkan otomatis. Silakan tinjau ulang draf sebelum mengirim.",
    rule: "Wajib muncul otomatis jika warga mengubah foto/koordinat/ukuran/teks setelah mencentang persetujuan.",
  },
  {
    context: "Label Rekomendasi Weather-Road Intel (BRL-12)",
    copy: "Indikatif — Bukan pengganti survei teknis lapangan",
    rule: "Wajib menyertai setiap rekomendasi konstruksi berbasis aturan pada fitur Weather-Road Intelligence (F9).",
  },
  {
    context: "Disclaimer Kewenangan Perbaikan (BRL-13)",
    copy: "SIJAGO adalah platform partisipasi dan pengawasan warga. Waktu pelaksanaan perbaikan fisik sepenuhnya menjadi kewenangan instansi terkait.",
    rule: "Wajib tampil pada footer aplikasi dan email notifikasi pelapor agar tidak menimbulkan janji SLA palsu.",
  },
];

const SCREEN_DIRECTORY = [
  {
    num: "Layar 1/8",
    title: "Peta Publik & Partisipasi Komunitas (+1)",
    route: "/",
    role: "Warga & Publik",
    features: "F4 • Filter 6 Kecamatan, Marker Semantik, +1 Saya Lewat Sini",
  },
  {
    num: "Layar 2/8",
    title: "Stepper Lapor Jalan Rusak & Panel Sanding AI",
    route: "/lapor",
    role: "Warga Pelapor",
    features: "F1, F2, F3 • Geotagging Bogor, Draf gpt-6-luna, Hash SHA-256",
  },
  {
    num: "Layar 3/8",
    title: "Detail Laporan, Tag OTP & Community Sign-Off",
    route: "/laporan/SJG-2026-1042",
    role: "Warga & Komunitas",
    features: "F4, F10 • OTP Email Resend, Sanding Foto Sebelum/Sesudah, Reopen",
  },
  {
    num: "Layar 4/8",
    title: "Pelacakan Tiket Tanpa Login & Cetak PDF",
    route: "/lacak",
    role: "Warga Pelapor",
    features: "F8, F2 • Timeline Audit-Backed, Cetak Lembar Laporan Resmi",
  },
  {
    num: "Layar 5/8",
    title: "Dashboard Moderasi Admin, Blur Foto & Eskalasi",
    route: "/admin/moderasi",
    role: "Admin SIJAGO",
    features: "F5 • Cek EXIF >100m, Blur Privasi Cloudinary, Modal Email Resend",
  },
  {
    num: "Layar 6A/8",
    title: "Penelusuran Append-Only Audit Log & Hash Chain",
    route: "/admin/audit",
    role: "Admin & Auditor",
    features: "F7 • Riwayat Mutasi Terkunci Trigger PostgreSQL & Snapshot JSON",
  },
  {
    num: "Layar 6B/8",
    title: "Konfigurasi Parameter Sistem Dinamis",
    route: "/admin/pengaturan",
    role: "Super Admin",
    features: "US-20 • Pengaturan Radius Duplikat, Timeout AI, & Ambang Hujan",
  },
  {
    num: "Layar 7/8",
    title: "Portal Tindak Lanjut Mitra Instansi Simulasi",
    route: "/instansi/laporan",
    role: "Petugas Instansi",
    features: "F6 • Isolasi Tenant PUPR/Bina Marga/BBPJN & Bukti Foto Selesai",
  },
  {
    num: "Layar 8/8",
    title: "Dashboard Weather-Road Intelligence & CSV",
    route: "/instansi/weather-intelligence",
    role: "Instansi & Publik",
    features: "F9, F7 • Korelasi Hujan Open-Meteo, Zona Merah, Rekomendasi Indikatif",
  },
];

export default function ThemeGuidePage() {
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "COLORS" | "TYPO" | "COMPONENTS" | "GOVERNANCE"
  >("ALL");

  const copyToClipboard = async (text: string) => {
    try {
      setCopyError(null);
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setCopyError("Tidak dapat menyalin. Pilih teks dan salin secara manual.");
    }
  };

  const [category, setCategory] = useState("LUBANG");
  const [approved, setApproved] = useState(false);
  const [supported, setSupported] = useState(false);
  const [ticket, setTicket] = useState("");
  const [demoState, setDemoState] = useState("default");
  const visible = (tab: string) => activeTab === "ALL" || activeTab === tab;

  return (
    <main className="theme-guide">
      <div className="guide-container">
        <header className="guide-heading"><h1>Panduan desain SIJAGO</h1><p>Acuan visual untuk antarmuka warga: jelas, tenang, dan mudah digunakan.</p><div className="guide-heading-links"><Link href="/">Lihat peta publik</Link><Link href="/lapor">Lihat alur pelaporan</Link></div></header>
        {copyError && <p role="alert" className="guide-copy-error">{copyError}</p>}
        <div className="guide-layout">
          <nav className="guide-index" aria-label="Bagian panduan">{[{id:"ALL",label:"Semua bagian"},{id:"COLORS",label:"Warna & status"},{id:"TYPO",label:"Tipografi & layout"},{id:"COMPONENTS",label:"Komponen warga"},{id:"GOVERNANCE",label:"Draf & persetujuan"}].map((tab)=><button key={tab.id} type="button" aria-pressed={activeTab===tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}>{tab.label}</button>)}<p>Mengikuti halaman warga terbaru dan aturan sijago-docs.</p></nav>
          <div className="guide-content">
            {visible("COLORS") && <section className="guide-section" id="colors"><h2>Warna yang punya peran</h2><p>Gunakan token bersama dari <code>public-map/tokens.css</code>. Biru menandai aksi; warna status membantu membaca kondisi.</p><div className="guide-palette">{BRAND_COLORS.map(color=><article key={color.token} className="guide-color"><div className="guide-swatch" style={{backgroundColor:`var(${color.token})`}} aria-label={`${color.name}, ${color.hex}`} /><h3>{color.name}</h3><span className="guide-caption">{color.role}</span><p>{color.usage}</p><div className="guide-copy-row"><button type="button" onClick={() => copyToClipboard(color.hex)}><Copy size={14} aria-hidden="true" />{copiedCode===color.hex?"Disalin":color.hex}</button><button type="button" onClick={() => copyToClipboard(color.tailwindBg)}>{copiedCode===color.tailwindBg?"Disalin":color.tailwindBg.startsWith("var(")?"Salin nilai CSS":"Salin kelas"}</button></div><button type="button" className="guide-token" onClick={() => copyToClipboard(color.token)}>{color.token}</button></article>)}</div>
              <h3 className="guide-subhead">Status laporan dan marker peta</h3><p>Warna marker memakai token status. Badge memakai latar lembut, teks yang kontras, dan nama status; warna bukan satu-satunya petunjuk.</p><div className="guide-status-list">{MAP_MARKER_TOKENS.map(item=><div key={item.status}><span className="guide-status-name">{item.status}</span><p>{item.desc}</p><button type="button" onClick={() => copyToClipboard(item.hex)}><span className="guide-status-swatch" style={{backgroundColor:`var(${item.token})`}} aria-hidden="true" />{copiedCode===item.hex?"Disalin":item.hex}</button></div>)}</div><p className="guide-note">Warna tambahan pada panduan teknis: Slate Neutral #475569 untuk draf template dan Amber Alert #D97706 untuk peringatan. Teks status memakai pasangan ink yang sesuai, bukan warna marker mentah.</p>
            </section>}

            {visible("TYPO") && <section className="guide-section" id="typography"><h2>Plus Jakarta Sans, di seluruh halaman</h2><p>Satu keluarga font untuk judul, isi, label, dan kode tiket. Gunakan bobot 400, 600, dan 700; angka perbandingan memakai tabular numerals.</p><div className="guide-type-list">{TYPOGRAPHY_SCALE.map(t=><div key={t.token}><div><h3>{t.token}</h3><p className="guide-caption">{t.spec}</p><button type="button" className="guide-token" onClick={() => copyToClipboard(t.tailwind)}>{copiedCode===t.tailwind?"Disalin":t.tailwind}</button></div><p className={`guide-type-${t.kind}`}>{t.sample}</p></div>)}</div>
              <h3 className="guide-subhead">Ruang, permukaan, dan perilaku responsif</h3><div className="guide-rules"><div><h4>Container</h4><p>Maksimum 1280 px pada peta, Lapor, dan Lacak; detail laporan 1200 px. Gutter umum 24 px, menjadi 16 px pada ponsel.</p></div><div><h4>Radius</h4><p>Panel dan dialog 16 px. Tombol, input, dan tag 8 px. Pill hanya untuk badge atau penanda yang memerlukannya.</p></div><div><h4>Spacing</h4><p>Skala 2, 4, 8, 12, 16, 24, 40, 64 px. Gunakan garis pemisah dan whitespace sebelum menambahkan panel.</p></div><div><h4>Aksesibilitas</h4><p>Target sentuh minimal 44 px. Fokus keyboard terlihat langsung. Label tetap terbaca dan layout tidak meluber mulai 320 px.</p></div></div>
              <details className="guide-disclosure"><summary>Acuan dashboard admin dan instansi</summary><p>Dashboard memakai komposisi desktop dengan maksimum 1280 px dan pembagian panel antrean serta pemeriksaan. Panduan ini memusatkan contoh visual pada sisi warga; aturan bisnis admin tetap mengikuti sijago-docs.</p></details>
            </section>}

            {visible("COMPONENTS") && <section className="guide-section" id="components"><h2>Komponen yang dipakai warga</h2><p>Contoh di bagian ini hanya mengubah pratinjau lokal, tanpa mengirim laporan atau penilaian.</p><h3 className="guide-subhead">Tombol dan pilihan</h3><div className="guide-preview"><Link href="/lapor" className="guide-button guide-primary">Lapor jalan rusak</Link><button type="button" className="guide-button" aria-pressed={supported} onClick={()=>setSupported(!supported)}><ThumbsUp size={16} aria-hidden="true" />{supported?"Sudah didukung":"+1 Saya Lewat Sini"}</button><button type="button" disabled className="guide-button">Belum tersedia</button></div><p className="guide-note">Satu gaya tombol primer biru. Aksi pendamping memakai border; hijau dan indigo digunakan untuk informasi status.</p>
              <h3 className="guide-subhead">Form, validasi, dan persetujuan</h3><div className="guide-form-example"><div className="guide-field"><label htmlFor="guide-ticket">Kode tiket</label><input id="guide-ticket" value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="Contoh: SJG-2026-1042" aria-invalid={demoState==="error"} aria-describedby="guide-ticket-help" /><p id="guide-ticket-help" className="guide-note">{demoState==="error"?"Kode tiket tidak ditemukan. Periksa kembali kode Anda.":"Label tetap terlihat ketika input terisi."}</p></div><div className="guide-field"><label htmlFor="guide-category">Kategori kerusakan</label><select id="guide-category" value={category} onChange={e=>setCategory(e.target.value)}><option value="LUBANG">Lubang</option><option value="RETAK">Retak</option><option value="AMBLAS">Amblas</option><option value="GENANGAN_DRAINASE">Genangan / drainase</option></select></div><label className="guide-checkbox"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} />{MANDATORY_MICROCOPY[2].copy}</label><button type="button" disabled={!approved} className="guide-button guide-primary" onClick={()=>setDemoState("success")}>Pratinjau persetujuan</button></div>
              <div className="guide-state-controls" aria-label="Pratinjau state">{[{id:"default",label:"Default"},{id:"loading",label:"Loading"},{id:"empty",label:"Kosong"},{id:"error",label:"Error"},{id:"success",label:"Berhasil"}].map(state=><button key={state.id} type="button" aria-pressed={demoState===state.id} onClick={()=>setDemoState(state.id)}>{state.label}</button>)}</div><div className={`guide-state-output ${demoState==="error"?"guide-error":""}`} role="status">{demoState==="loading"?"Sedang memuat laporan…":demoState==="empty"?"Belum ada hasil. Masukkan kode tiket untuk mencari laporan.":demoState==="error"?"Laporan belum ditemukan. Coba periksa kode tiket.":demoState==="success"?"Contoh state berhasil. Tidak ada data yang dikirim.":"Hover mengubah permukaan, fokus memakai outline, dan tombol terpilih ditandai secara visual."}</div>
              <h3 className="guide-subhead">Label dan ringkasan laporan</h3><div className="guide-preview"><span className="guide-badge guide-ai">[Draf Dibantu AI]</span><span className="guide-badge guide-civic">Selesai</span><span className="guide-badge">Lubang</span><span className="guide-badge">Tertutup Genangan Air (7)</span><span className="guide-badge">Rawan Kecelakaan Malam (4)</span></div><p className="guide-note">Contoh data: lubang berukuran 80 cm × 60 cm × 12 cm. Angka pada komponen ini hanya contoh dari laporan demo.</p><p className="guide-note">Community Sign-Off: laporan dibuka kembali jika minimal 3 suara dan lebih dari 50% menyatakan cepat rusak.</p><h3 className="guide-subhead">Pola halaman warga</h3><div className="guide-patterns">{[{route:"/",title:"Beranda & peta",text:"Hero foto dengan konten di kiri, filter ringkas, daftar laporan dan peta, lalu FAQ."},{route:"/lapor",title:"Pelaporan",text:"Tiga tahap: fakta, draf, dan persetujuan. Panduan di kiri desktop, satu kolom di ponsel."},{route:"/lacak",title:"Pelacakan",text:"Pencarian tiket, ringkasan status, tombol dokumen, dan timeline vertikal."},{route:"/laporan/SJG-2026-1042",title:"Detail laporan",text:"Judul dan status, bukti sebelum/sesudah, partisipasi warga, fakta dan peta lokasi."}].map(pattern=><Link href={pattern.route} key={pattern.route}><h4>{pattern.title}</h4><p>{pattern.text}</p><span>Lihat halaman</span></Link>)}</div>
              <div className="guide-brand-example"><Image src="/images/logo_header.svg" alt="SIJAGO, Sistem Jalan Bogor" width={190} height={66} /><p>Navbar menempatkan logo di kiri, navigasi dan CTA di kanan. Footer memakai nama brand besar, divider, deskripsi, navigasi, dan copyright.</p></div>
            </section>}

            {visible("GOVERNANCE") && <section className="guide-section" id="governance"><h2>Draf transparan, persetujuan tetap di warga</h2><p>Aturan AI dan governance tetap mengikuti sijago-docs. Label sumber draf harus terlihat; bantuan AI tidak menggantikan tinjauan manusia.</p><div className="guide-preview"><span className="guide-badge guide-ai">[Draf Dibantu AI]</span><span className="guide-badge">[Draf Template]</span><span className="guide-badge guide-civic">Email terverifikasi</span></div><div className="guide-governance-list">{MANDATORY_MICROCOPY.map(m=><article key={m.context}><h3>{m.context}</h3><blockquote>{m.copy}</blockquote><p>{m.rule}</p><button type="button" onClick={() => copyToClipboard(m.copy)}><Copy size={14} aria-hidden="true" />{copiedCode===m.copy?"Disalin":"Salin teks wajib"}</button></article>)}</div><details className="guide-disclosure"><summary>Contoh rekomendasi teknis indikatif</summary><p>Evaluasi kapasitas saluran drainase tepi jalan di Jl. Ir. H. Juanda dan pertimbangkan perkerasan kaku pada titik genangan berulang.</p><p>Indikatif — Bukan pengganti survei teknis lapangan.</p></details></section>}

            <section className="guide-section guide-directory"><h2>Direktori halaman SIJAGO</h2><p>Empat halaman warga menjadi acuan visual panduan ini. Rute admin dan instansi tetap tersedia untuk referensi alur sistem.</p>{SCREEN_DIRECTORY.map(scr=><Link key={scr.route} href={scr.route}><div><h3>{scr.title}</h3><p>{scr.role}</p><p>{scr.features.replaceAll(" • ", ": ")}</p></div><code>{scr.route}</code></Link>)}</section>
          </div>
        </div>
        <span className="guide-sr-only" role="status" aria-live="polite">{copiedCode?"Teks berhasil disalin":""}</span>
      </div>
    </main>
  );
}
