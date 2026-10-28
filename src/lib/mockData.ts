export interface MockReportItem {
  id: string;
  ticketCode: string;
  trackingToken: string;
  title: string;
  body: string;
  draftSource: "AI" | "TEMPLATE";
  permanentLabel: "✨ [Draf Dibantu AI]" | "📄 [Draf Template]";
  status:
    | "MENUNGGU_VERIFIKASI"
    | "TERVERIFIKASI"
    | "DITERUSKAN"
    | "DIPROSES"
    | "SELESAI"
    | "DIBUKA_KEMBALI"
    | "DITOLAK";
  category: "LUBANG" | "RETAK" | "AMBLAS" | "BERGELOMBANG" | "GENANGAN_DRAINASE";
  sizeClass: "KECIL" | "SEDANG" | "BESAR";
  dimensionsCm: string;
  districtName: string;
  subdistrictName: string;
  landmark: string;
  suggestedStreetName: string;
  lat: number;
  lng: number;
  gpsAccuracyMeters: number;
  locationSource: "GPS" | "MANUAL_PIN";
  exifDistanceMeters: number;
  exifMismatchFlag: boolean;
  upvotes: number;
  priorityScore: number;
  assignedAgency: string | null;
  isRecurrentHotspot: boolean;
  createdAt: string;
  impactTags: string[];
  conditionTags: { code: string; label: string; count: number }[];
  signoffSummary: {
    monitoringDaysLeft: number;
    mulusCount: number;
    cepatRusakCount: number;
  };
}

export type ReportItem = MockReportItem;

export const MOCK_REPORTS: MockReportItem[] = [
  {
    id: "SJG-2026-1042",
    ticketCode: "SJG-2026-1042",
    trackingToken: "trk_demo_1042",
    title: "Lubang Jalan Berukuran 80x60x12 cm di Depan Pintu 1 Kebun Raya Bogor",
    body: "Dilaporkan kerusakan jalan kategori lubang berukuran panjang 80 cm, lebar 60 cm, dan kedalaman 12 cm (kelas sedang) dengan patokan di depan gerbang masuk Kebun Raya Bogor Pintu 1, lajur kiri arah BTM. Kondisi lubang sering tertutup genangan air saat hujan sore sehingga membahayakan pengendara roda dua dan memicu perlambatan arus lalu lintas.",
    draftSource: "AI",
    permanentLabel: "✨ [Draf Dibantu AI]",
    status: "SELESAI",
    category: "LUBANG",
    sizeClass: "SEDANG",
    dimensionsCm: "80 × 60 × 12 cm",
    districtName: "Bogor Tengah",
    subdistrictName: "Paledang",
    landmark: "Depan Pintu 1 Kebun Raya Bogor, Jl. Ir. H. Juanda lajur kiri arah BTM",
    suggestedStreetName: "Jl. Ir. H. Juanda, Paledang, Bogor Tengah, Kota Bogor",
    lat: -6.597147,
    lng: 106.806039,
    gpsAccuracyMeters: 8.4,
    locationSource: "GPS",
    exifDistanceMeters: 6.2,
    exifMismatchFlag: false,
    upvotes: 24,
    priorityScore: 89.5,
    assignedAgency: "Dinas PUPR Kota Bogor (Simulasi)",
    isRecurrentHotspot: true,
    createdAt: "25 Okt 2026, 14:20 WIB",
    impactTags: ["Membahayakan Roda Dua", "Menimbulkan Macet"],
    conditionTags: [
      { code: "TERTUTUP_GENANGAN_AIR", label: "🌊 Tertutup Genangan Air", count: 9 },
      { code: "RAWAN_PEMOTOR_JATUH", label: "⚠️ Rawan Pemotor Jatuh", count: 6 },
    ],
    signoffSummary: {
      monitoringDaysLeft: 24,
      mulusCount: 5,
      cepatRusakCount: 2,
    },
  },
  {
    id: "SJG-2026-1045",
    ticketCode: "SJG-2026-1045",
    trackingToken: "trk_demo_1045",
    title: "Jalan Amblas dan Drainase Meluap di Jl. Sholeh Iskandar Arah Yasmin",
    body: "Dilaporkan kerusakan permukaan jalan kategori amblas berukuran besar (panjang 150 cm, lebar 90 cm, kedalaman 18 cm) di dekat putaran balik Lotte Grosir Jl. Sholeh Iskandar. Saluran drainase tepi jalan tersumbat saat hujan deras sehingga genangan menutup badan jalan.",
    draftSource: "AI",
    permanentLabel: "✨ [Draf Dibantu AI]",
    status: "DITERUSKAN",
    category: "AMBLAS",
    sizeClass: "BESAR",
    dimensionsCm: "150 × 90 × 18 cm",
    districtName: "Tanah Sareal",
    subdistrictName: "Kedungbadak",
    landmark: "100 meter sebelum u-turn Lotte Grosir Jl. Sholeh Iskandar arah Yasmin",
    suggestedStreetName: "Jl. KH. Sholeh Iskandar, Tanah Sareal, Kota Bogor",
    lat: -6.5612,
    lng: 106.7815,
    gpsAccuracyMeters: 11.0,
    locationSource: "GPS",
    exifDistanceMeters: 12.1,
    exifMismatchFlag: false,
    upvotes: 31,
    priorityScore: 94.0,
    assignedAgency: "BBPJN Nasional DKI - Jabar (Simulasi)",
    isRecurrentHotspot: true,
    createdAt: "26 Okt 2026, 08:10 WIB",
    impactTags: ["Membahayakan Roda Dua", "Menimbulkan Macet", "Pernah Terjadi Kecelakaan"],
    conditionTags: [
      { code: "TERTUTUP_GENANGAN_AIR", label: "🌊 Tertutup Genangan Air", count: 14 },
      { code: "MINIM_PENERANGAN", label: "🌑 Minim Penerangan Malam", count: 7 },
    ],
    signoffSummary: {
      monitoringDaysLeft: 30,
      mulusCount: 0,
      cepatRusakCount: 0,
    },
  },
  {
    id: "SJG-2026-1049",
    ticketCode: "SJG-2026-1049",
    trackingToken: "trk_demo_1049",
    title: "[RETAK - SEDANG] Kerusakan Jalan di Depan Pasar Sukasari Jl. Siliwangi",
    body: "Dilaporkan kerusakan jalan kategori retak dengan kelas ukuran sedang (panjang 120 cm, lebar 40 cm). Patokan lokasi berada di depan area pemberhentian angkot Pasar Sukasari, Jl. Siliwangi. Kondisi ini berdampak pada mengganggu kenyamanan pengguna jalan.",
    draftSource: "TEMPLATE",
    permanentLabel: "📄 [Draf Template]",
    status: "MENUNGGU_VERIFIKASI",
    category: "RETAK",
    sizeClass: "SEDANG",
    dimensionsCm: "120 × 40 × 5 cm",
    districtName: "Bogor Timur",
    subdistrictName: "Sukasari",
    landmark: "Depan Pasar Sukasari Jl. Siliwangi",
    suggestedStreetName: "Jl. Siliwangi, Bogor Timur, Kota Bogor",
    lat: -6.6152,
    lng: 106.8142,
    gpsAccuracyMeters: 42.0,
    locationSource: "MANUAL_PIN",
    exifDistanceMeters: 185.4,
    exifMismatchFlag: true,
    upvotes: 4,
    priorityScore: 52.0,
    assignedAgency: null,
    isRecurrentHotspot: false,
    createdAt: "27 Okt 2026, 17:05 WIB",
    impactTags: ["Menimbulkan Macet"],
    conditionTags: [],
    signoffSummary: {
      monitoringDaysLeft: 30,
      mulusCount: 0,
      cepatRusakCount: 0,
    },
  },
];

export const STATUS_BADGE_MAP: Record<
  MockReportItem["status"],
  { label: string; className: string; dotColor: string }
> = {
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu Verifikasi Admin",
    className: "bg-amber-50 text-amber-800 border-amber-300",
    dotColor: "#D97706",
  },
  TERVERIFIKASI: {
    label: "Terverifikasi (Publik)",
    className: "bg-blue-50 text-blue-800 border-blue-300",
    dotColor: "#2563EB",
  },
  DITERUSKAN: {
    label: "Diteruskan ke Instansi",
    className: "bg-purple-50 text-purple-800 border-purple-300",
    dotColor: "#7C3AED",
  },
  DIPROSES: {
    label: "Sedang Diproses Instansi",
    className: "bg-orange-50 text-orange-800 border-orange-300",
    dotColor: "#EA580C",
  },
  SELESAI: {
    label: "Selesai (Dalam Pemantauan 30 Hari)",
    className: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dotColor: "#16A34A",
  },
  DIBUKA_KEMBALI: {
    label: "Dibuka Kembali (Tambalan Cepat Rusak)",
    className: "bg-red-50 text-red-800 border-red-300",
    dotColor: "#DC2626",
  },
  DITOLAK: {
    label: "Ditolak Moderasi",
    className: "bg-slate-100 text-slate-700 border-slate-300",
    dotColor: "#64748B",
  },
};
