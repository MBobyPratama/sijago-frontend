export interface ReportItem {
  publicAdminResponse?: string | null;
  description?: import("@/components/ReportDescription").ReportDescriptionData | null;
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
  gpsAccuracyMeters: number | null;
  locationSource: "GPS" | "MANUAL_PIN";
  exifDistanceMeters: number | null;
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


export const STATUS_BADGE_MAP: Record<
  ReportItem["status"],
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
