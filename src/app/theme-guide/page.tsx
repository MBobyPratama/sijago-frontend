"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./theme-guide.css";
import { Copy, ThumbsUp } from "lucide-react";
import { ReportDescription } from "@/components/ReportDescription";

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
    context: "Persetujuan pengiriman laporan",
    copy: "Saya sudah meninjau dan menyetujui draf ini. Saya menyatakan bahwa data Fakta Asal yang dilaporkan sesuai dengan kondisi nyata di lapangan.",
    rule: "Tombol Kirim Laporan wajib terkunci (disabled) sampai checkbox ini dicentang oleh pelapor.",
  },
  {
    context: "Data laporan berubah",
    copy: "Data Fakta Asal Anda telah berubah. Persetujuan sebelumnya dibatalkan otomatis. Silakan kembali ke data laporan, simpan, dan tinjau ulang sebelum mengirim.",
    rule: "Wajib muncul otomatis jika warga mengubah foto/koordinat/ukuran/teks setelah mencentang persetujuan.",
  },
  {
    context: "Rekomendasi cuaca dan jalan",
    copy: "Indikatif — Bukan pengganti survei teknis lapangan",
    rule: "Wajib menyertai setiap rekomendasi konstruksi berbasis aturan pada fitur Weather-Road Intelligence (F9).",
  },
  {
    context: "Kewenangan perbaikan jalan",
    copy: "SIJAGO adalah platform partisipasi dan pengawasan warga. Waktu pelaksanaan perbaikan fisik sepenuhnya menjadi kewenangan instansi terkait.",
    rule: "Wajib tampil pada footer aplikasi dan email notifikasi pelapor agar tidak menimbulkan janji SLA palsu.",
  },
];

const SCREEN_DIRECTORY = [
  {
    num: "Layar 1/8",
    title: "Beranda dan peta publik",
    route: "/",
    role: "Warga & Publik",
    features: "Hero, filter laporan, peta, dukungan warga, logo instansi, FAQ, dan footer.",
  },
  {
    num: "Layar 2/8",
    title: "Lapor jalan rusak dalam dua tahap",
    route: "/lapor",
    role: "Warga Pelapor",
    features: "Isi data, pilih titik peta, tinjau draf template, setujui, lalu kirim. Tiket disimpan di perangkat.",
  },
  {
    num: "Layar 3/8",
    title: "Detail laporan melalui tiket",
    route: "/lacak",
    role: "Warga & Komunitas",
    features: "Buka detail dari peta atau tiket: deskripsi berpoin, preview foto, tanggapan admin, tag dan penilaian dengan verifikasi email.",
  },
  {
    num: "Layar 4/8",
    title: "Pelacakan tiket dan cetak PDF",
    route: "/lacak",
    role: "Warga Pelapor",
    features: "Pencarian tiket, riwayat status, tiket perangkat, tanggapan admin, dan cetak lembar laporan.",
  },
  {
    num: "Layar 5/8",
    title: "Moderasi laporan admin",
    route: "/admin/moderasi",
    role: "Admin SIJAGO",
    features: "Antrean 10 laporan per halaman, pencarian dan filter server, verifikasi/pembatalan, penggabungan, serta eskalasi.",
  },
  {
    num: "Layar 6A/8",
    title: "Riwayat audit dan ekspor CSV / JSON",
    route: "/admin/audit",
    role: "Admin & Auditor",
    features: "Filter peristiwa, snapshot sebelum/sesudah dan hash tersimpan. Ekspor hasil filter yang dimuat ikut dicatat; integritas hash belum diperiksa otomatis.",
  },
  {
    num: "Layar 6B/8",
    title: "Pengaturan sistem",
    route: "/admin/pengaturan",
    role: "Super Admin",
    features: "Parameter dengan satuan, validasi, penanda perubahan, serta simpan/batalkan. Dampak perubahan dijelaskan dekat tombol simpan.",
  },
  {
    num: "Layar 7/8",
    title: "Dashboard tindak lanjut instansi",
    route: "/instansi/laporan",
    role: "Petugas Instansi",
    features: "Akses sesuai instansi, pembaruan status, pengembalian ke admin, dan unggah bukti perbaikan.",
  },
  {
    num: "Layar 8/8",
    title: "Weather-Road Intelligence",
    route: "/instansi/weather-intelligence",
    role: "Petugas instansi",
    features: "Data cuaca, zona berisiko, rekomendasi indikatif, dan ekspor CSV untuk instansi.",
  },
  { num: "Login petugas", title: "Login admin dan instansi", route: "/login", role: "Admin dan petugas instansi", features: "Form login, logo SIJAGO, background foto kebiruan, maskot, dan pengalihan ke dashboard sesuai peran." },
];

export default function ThemeGuidePage() {
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "COLORS" | "TYPO" | "COMPONENTS" | "DASHBOARD" | "GOVERNANCE"
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
  const [demoPage, setDemoPage] = useState(1);
  const visible = (tab: string) => activeTab === "ALL" || activeTab === tab;

  return (
    <main className="theme-guide">
      <div className="guide-container">
        <header className="guide-heading"><h1>Panduan desain SIJAGO</h1><p>Acuan desain dan perilaku antarmuka warga, admin, dan instansi sesuai implementasi SIJAGO saat ini.</p><div className="guide-heading-links"><Link href="/">Lihat peta publik</Link><Link href="/lapor">Lihat alur pelaporan</Link></div></header>
        {copyError && <p role="alert" className="guide-copy-error">{copyError}</p>}
        <div className="guide-layout">
          <nav className="guide-index" aria-label="Bagian panduan">{[{id:"ALL",label:"Semua bagian"},{id:"COLORS",label:"Warna & status"},{id:"TYPO",label:"Tipografi & layout"},{id:"COMPONENTS",label:"Komponen warga"},{id:"DASHBOARD",label:"Dashboard petugas"},{id:"GOVERNANCE",label:"Persetujuan & privasi"}].map((tab)=><button key={tab.id} type="button" aria-pressed={activeTab===tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}>{tab.label}</button>)}<p>Mengikuti halaman warga, dashboard petugas, dan aturan sijago-docs.</p></nav>
          <div className="guide-content">
            {visible("COLORS") && <section className="guide-section" id="colors"><h2>Warna yang punya peran</h2><p>Gunakan token bersama dari <code>public-map/tokens.css</code>. Biru menandai aksi; warna status membantu membaca kondisi.</p><div className="guide-palette">{BRAND_COLORS.map(color=><article key={color.token} className="guide-color"><div className="guide-swatch" style={{backgroundColor:`var(${color.token})`}} aria-label={`${color.name}, ${color.hex}`} /><h3>{color.name}</h3><span className="guide-caption">{color.role}</span><p>{color.usage}</p><div className="guide-copy-row"><button type="button" onClick={() => copyToClipboard(color.hex)}><Copy size={14} aria-hidden="true" />{copiedCode===color.hex?"Disalin":color.hex}</button><button type="button" onClick={() => copyToClipboard(color.tailwindBg)}>{copiedCode===color.tailwindBg?"Disalin":color.tailwindBg.startsWith("var(")?"Salin nilai CSS":"Salin kelas"}</button></div><button type="button" className="guide-token" onClick={() => copyToClipboard(color.token)}>{color.token}</button></article>)}</div>
              <h3 className="guide-subhead">Klasik, biru, dan gelap</h3><div className="guide-rules"><div><h4>Klasik</h4><p>Palet di atas menunjukkan nilai acuan tema klasik. Tema lain mengganti token permukaan, teks, dan kontrol sesuai konteks.</p></div><div><h4>Biru</h4><p>Latar gradient biru memakai token tema bersama; hierarki tombol dan warna status tetap konsisten.</p></div><div><h4>Gelap</h4><p>Permukaan dan teks menyesuaikan tema gelap. Peta dasar tetap terang agar jalan dan titik laporan mudah dibaca.</p></div><div><h4>Satu pilihan tema</h4><p>Ikon tema berada di sisi paling kanan navigasi warga dan dashboard. Pilihan disimpan pada perangkat dan dipakai bersama pada halaman yang mendukung tema. Theme guide ini menampilkan acuan klasik.</p></div></div>
              <h3 className="guide-subhead">Status laporan dan marker peta</h3><p>Warna marker memakai token status. Badge memakai latar lembut, teks yang kontras, dan nama status; warna bukan satu-satunya petunjuk.</p><div className="guide-status-list">{MAP_MARKER_TOKENS.map(item=><div key={item.status}><span className="guide-status-name">{item.status}</span><p>{item.desc}</p><button type="button" onClick={() => copyToClipboard(item.hex)}><span className="guide-status-swatch" style={{backgroundColor:`var(${item.token})`}} aria-hidden="true" />{copiedCode===item.hex?"Disalin":item.hex}</button></div>)}</div><p className="guide-note">Warna tambahan pada panduan teknis: Slate Neutral #475569 untuk draf template dan Amber Alert #D97706 untuk peringatan. Teks status memakai pasangan ink yang sesuai, bukan warna marker mentah.</p>
            </section>}

            {visible("TYPO") && <section className="guide-section" id="typography"><h2>Plus Jakarta Sans, di seluruh halaman</h2><p>Satu keluarga font untuk judul, isi, label, dan kode tiket. Gunakan bobot 400, 600, dan 700; angka perbandingan memakai tabular numerals.</p><div className="guide-type-list">{TYPOGRAPHY_SCALE.map(t=><div key={t.token}><div><h3>{t.token}</h3><p className="guide-caption">{t.spec}</p><button type="button" className="guide-token" onClick={() => copyToClipboard(t.tailwind)}>{copiedCode===t.tailwind?"Disalin":t.tailwind}</button></div><p className={`guide-type-${t.kind}`}>{t.sample}</p></div>)}</div>
              <h3 className="guide-subhead">Ruang, permukaan, dan perilaku responsif</h3><div className="guide-rules"><div><h4>Container</h4><p>Maksimum 1280 px pada peta, Lapor, dan Lacak; detail laporan 1200 px. Gutter umum 24 px, menjadi 16 px pada ponsel.</p></div><div><h4>Radius</h4><p>Panel dan dialog 16 px. Tombol, input, dan tag 8 px. Pill hanya untuk badge atau penanda yang memerlukannya.</p></div><div><h4>Spacing</h4><p>Skala 2, 4, 8, 12, 16, 24, 40, 64 px. Gunakan garis pemisah dan whitespace sebelum menambahkan panel.</p></div><div><h4>Aksesibilitas</h4><p>Target sentuh minimal 44 px. Fokus keyboard terlihat langsung. Label tetap terbaca dan layout tidak meluber mulai 320 px.</p></div></div>
              <p className="guide-note">Dashboard petugas memakai sidebar pada desktop dan navigasi responsif di ponsel. Panel antrean dan detail memiliki batas masing-masing. Lihat bagian Dashboard petugas untuk pola operasional.</p>
            </section>}

            {visible("COMPONENTS") && <section className="guide-section" id="components"><h2>Komponen yang dipakai warga</h2><p>Contoh di bagian ini hanya mengubah pratinjau lokal, tanpa mengirim laporan atau penilaian.</p><h3 className="guide-subhead">Tombol dan pilihan</h3><div className="guide-preview"><Link href="/lapor" className="guide-button guide-primary">Lapor jalan rusak</Link><button type="button" className="guide-button" aria-pressed={supported} onClick={()=>setSupported(!supported)}><ThumbsUp size={16} aria-hidden="true" />{supported?"Sudah didukung":"+1 Saya Lewat Sini"}</button><button type="button" disabled className="guide-button">Belum tersedia</button></div><p className="guide-note">Satu gaya tombol primer biru. Aksi pendamping memakai border; hijau dan indigo digunakan untuk informasi status.</p>
              <h3 className="guide-subhead">Form, validasi, dan persetujuan</h3><div className="guide-form-example"><div className="guide-field"><label htmlFor="guide-ticket">Kode tiket</label><input id="guide-ticket" value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="Contoh: SJG-2026-1042" aria-invalid={demoState==="error"} aria-describedby="guide-ticket-help" /><p id="guide-ticket-help" className="guide-note">{demoState==="error"?"Kode tiket tidak ditemukan. Periksa kembali kode Anda.":"Label tetap terlihat ketika input terisi. Fokus input memakai satu penanda yang jelas."}</p></div><div className="guide-field"><label htmlFor="guide-category">Kategori kerusakan</label><select id="guide-category" value={category} onChange={e=>{setCategory(e.target.value);setApproved(false);setDemoState("default");}}><option value="LUBANG">Lubang</option><option value="RETAK">Retak</option><option value="AMBLAS">Amblas</option><option value="BERGELOMBANG">Bergelombang</option><option value="GENANGAN_DRAINASE">Genangan / drainase</option></select></div><label className="guide-checkbox"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} />{MANDATORY_MICROCOPY[0].copy}</label><button type="button" disabled={!approved} className="guide-button guide-primary" onClick={()=>setDemoState("success")}>Pratinjau persetujuan</button></div>
              <div className="guide-state-controls" aria-label="Pratinjau state">{[{id:"default",label:"Default"},{id:"loading",label:"Loading"},{id:"empty",label:"Kosong"},{id:"error",label:"Error"},{id:"success",label:"Berhasil"}].map(state=><button key={state.id} type="button" aria-pressed={demoState===state.id} onClick={()=>setDemoState(state.id)}>{state.label}</button>)}</div><div className={`guide-state-output ${demoState==="error"?"guide-error":""}`} role="status">{demoState==="loading"?"Sedang memuat laporan…":demoState==="empty"?"Belum ada hasil. Masukkan kode tiket untuk mencari laporan.":demoState==="error"?"Laporan belum ditemukan. Coba periksa kode tiket.":demoState==="success"?"Contoh state berhasil. Tidak ada data yang dikirim.":"Hover mengubah permukaan, fokus memakai outline, dan tombol terpilih ditandai secara visual."}</div>
              <h3 className="guide-subhead">Label dan ringkasan laporan</h3><div className="guide-preview"><span className="guide-badge guide-civic">Selesai</span><span className="guide-badge">Lubang</span><span className="guide-badge">Tertutup Genangan Air (7)</span><span className="guide-badge">Rawan Kecelakaan Malam (4)</span></div><h3 className="guide-subhead">Deskripsi laporan dalam poin</h3><ReportDescription description={{ items: [{ label: "Kategori kerusakan", value: "Lubang" }, { label: "Kelas ukuran", value: "Sedang (perkiraan warga)" }, { label: "Patokan lokasi", value: "Dekat gerbang taman — contoh lokasi" }], condition: "Lubang tertutup air setelah hujan. Teks ini hanya contoh pratinjau." }} /><p className="guide-note">Data ilustrasi, bukan laporan nyata. Form warga memakai kelas ukuran kecil, sedang, atau besar dengan panduan perkiraan; tidak meminta panjang, lebar, dan kedalaman secara terpisah.</p><p className="guide-note">Community Sign-Off tersedia pada laporan selesai atau dibuka kembali selama pemantauan aktif. Pembukaan kembali mengikuti ambang jumlah suara cepat rusak dan proporsinya di pengaturan sistem; tidak dikunci ke angka tetap.</p><h3 className="guide-subhead">Pola halaman warga</h3><div className="guide-patterns">{[{route:"/",title:"Beranda & peta",text:"Hero foto dengan konten di kiri, filter ringkas, daftar laporan dan peta, lalu FAQ."},{route:"/lapor",title:"Pelaporan",text:"Dua tahap: data laporan, lalu tinjau dan kirim. Panduan di kiri desktop, satu kolom di ponsel."},{route:"/lacak",title:"Pelacakan",text:"Pencarian tiket, tiket dari perangkat, salin tiket, bagikan tautan, dokumen, dan timeline status."},{route:"/lacak",title:"Detail laporan",text:"Buka dari peta atau tiket untuk melihat deskripsi berpoin, preview foto, tanggapan admin, tag, penilaian, dan lokasi."}].map(pattern=><Link href={pattern.route} key={`${pattern.route}:${pattern.title}`}><h4>{pattern.title}</h4><p>{pattern.text}</p><span>Lihat halaman</span></Link>)}</div>
              <div className="guide-brand-example"><Image src="/images/logo_header.svg" alt="SIJAGO, Sistem Jalan Bogor" width={190} height={66} /><p>Navbar menempatkan logo di kiri, navigasi dan CTA di kanan. Footer memakai nama brand besar, divider, deskripsi, navigasi, dan copyright.</p></div>
            </section>}

            {visible("DASHBOARD") && <section className="guide-section" id="dashboard"><h2>Dashboard admin dan instansi</h2><p>Navigasi utama di kiri pada desktop. Header menyediakan kembali ke halaman warga, profil, logout, dan satu ikon tema di kanan. Akses menu dan data mengikuti peran; admin dan petugas instansi memiliki portal masing-masing.</p><div className="guide-rules"><div><h3>Antrean moderasi</h3><p>Daftar di kiri dan pemeriksaan di kanan, masing-masing dengan batas sendiri. Backend memuat 10 laporan per halaman. Pencarian tiket, judul, kecamatan, filter status, serta urutan prioritas atau terbaru berlaku pada seluruh laporan. Mengubah filter kembali ke halaman pertama.</p></div><div><h3>Tindakan sesuai status</h3><p>Aksi utama laporan menunggu verifikasi adalah Verifikasi & teruskan, dengan pilihan Verifikasi saja dan Tolak. Instansi tujuan dan pratinjau email dikonfirmasi sebelum diproses. Verifikasi tetap tersimpan jika penugasan gagal; email gagal tidak membatalkan penugasan dan dapat dikirim ulang. Pembatalan verifikasi tersedia bila masih memenuhi syarat sebelum diteruskan. Tiket induk dapat dicari lintas halaman. Penolakan dan pembatalan memakai dialog khusus; eskalasi menampilkan pratinjau email.</p></div><div><h3>Riwayat audit</h3><p>Tampilkan waktu UTC, aktor, tindakan, snapshot sebelum/sesudah, dan hash tersimpan. Filter berlaku pada data yang dimuat. Ekspor CSV/JSON mencakup semua halaman hasil filter dari maksimal 50 entri yang dimuat, bukan seluruh arsip. Aktivitas ekspor dicatat; verifikasi integritas hash otomatis belum tersedia.</p></div><div><h3>Pengaturan</h3><p>Label, bantuan, satuan, batas nilai, dan error berada dekat input. Satu penanda fokus mengelilingi gabungan input dan satuan. Nama kunci teknis tidak ditampilkan. Simpan dan Batalkan tetap mudah dijangkau, dengan penjelasan dampak perubahan di dekatnya.</p></div><div><h3>Tindak lanjut instansi</h3><p>Petugas hanya mengakses laporan sesuai instansinya. Perubahan status, pengembalian laporan, dan bukti sesudah perbaikan memakai kontrol yang sesuai tugas. Foto dibuka melalui preview di dalam situs.</p></div><div><h3>Weather-Road Intelligence</h3><p>Data cuaca dan risiko membantu pemeriksaan lapangan. Rekomendasi selalu ditandai indikatif dan tidak menjanjikan keputusan teknis atau jadwal perbaikan.</p></div></div><h3 className="guide-subhead">Contoh pagination antrean</h3><p className="guide-note">Simulasi lokal 23 laporan dengan 10 laporan per halaman. Tombol ini tidak mengambil data server.</p><nav className="guide-pagination" aria-label="Contoh halaman antrean"><p role="status">Menampilkan {(demoPage - 1) * 10 + 1}–{Math.min(demoPage * 10, 23)} dari 23 laporan</p><div><button type="button" className="guide-button" disabled={demoPage === 1} onClick={() => setDemoPage(demoPage - 1)}>Sebelumnya</button><span>Halaman {demoPage} / 3</span><button type="button" className="guide-button" disabled={demoPage === 3} onClick={() => setDemoPage(demoPage + 1)}>Berikutnya</button></div></nav></section>}

            {visible("GOVERNANCE") && <section className="guide-section" id="governance"><h2>Draf transparan, persetujuan tetap di warga</h2><p>Alur pelaporan warga memakai draf template dan dua tahap: isi data, lalu tinjau dan kirim. Tidak ada tahap susun draf atau tombol pembuatan laporan dengan AI. Badge sumber draf tidak ditampilkan di sisi warga; metadata AI pada laporan lama tetap dapat muncul di moderasi admin dan laporan instansi. Analisis foto dengan AI belum tersedia.</p><div className="guide-preview"><span className="guide-badge guide-civic">Email terverifikasi</span></div><div className="guide-rules"><div><h3>Email dan partisipasi warga</h3><p>Tag kondisi serta penilaian memerlukan verifikasi email. OTP berlaku 10 menit dan sekali pakai. Token verifikasi berlaku 30 menit untuk email, perangkat, dan laporan yang sama; jika kedaluwarsa, minta verifikasi ulang.</p></div><div><h3>Komentar hasil perbaikan</h3><p>Komentar dikirim bersama penilaian. Jika status atau masa pemantauan belum memenuhi syarat, jelaskan alasan kolom dikunci. Verifikasi email saja tidak membukanya; arahkan warga ke tag kondisi untuk pembaruan saat ini.</p></div><div><h3>Catatan internal dan tanggapan publik</h3><p>Catatan koreksi hanya untuk admin/instansi dan tidak dikirim melalui API publik. Tanggapan admin untuk warga disimpan terpisah dan muncul pada detail serta pelacakan. Jangan otomatis memublikasikan catatan internal.</p></div><div><h3>Tiket tanpa akun warga</h3><p>Tiket tersimpan otomatis di perangkat. Sediakan Salin tiket dan Bagikan tautan pelacakan. Penghapusan tiket memakai dialog khusus dan hanya menghapus simpanan perangkat. Tiket dan tautan dikirim melalui email bila warga mengisi email pada pelaporan.</p></div></div><div className="guide-governance-list">{MANDATORY_MICROCOPY.map(m=><article key={m.context}><h3>{m.context}</h3><blockquote>{m.copy}</blockquote><p>{m.rule}</p><button type="button" onClick={() => copyToClipboard(m.copy)}><Copy size={14} aria-hidden="true" />{copiedCode===m.copy?"Disalin":"Salin teks wajib"}</button></article>)}</div><details className="guide-disclosure"><summary>Contoh rekomendasi teknis indikatif</summary><p>Evaluasi kapasitas saluran drainase tepi jalan di Jl. Ir. H. Juanda dan pertimbangkan perkerasan kaku pada titik genangan berulang.</p><p>Indikatif — Bukan pengganti survei teknis lapangan.</p></details></section>}

            <section className="guide-section guide-directory"><h2>Direktori halaman SIJAGO</h2><p>Halaman warga dapat dibuka tanpa akun. Detail laporan memerlukan tiket atau pilihan laporan di peta; tautannya di sini menuju pelacakan. Dashboard memerlukan login dengan peran yang sesuai.</p>{SCREEN_DIRECTORY.map(scr=><Link key={scr.num} href={scr.route}><div><h3>{scr.title}</h3><p>{scr.role}</p><p>{scr.features.replaceAll(" • ", ": ")}</p></div><code>{scr.route}</code></Link>)}</section>
          </div>
        </div>
        <span className="guide-sr-only" role="status" aria-live="polite">{copiedCode?"Teks berhasil disalin":""}</span>
      </div>
    </main>
  );
}
