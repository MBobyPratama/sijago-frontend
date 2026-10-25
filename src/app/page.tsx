import { BogorMap } from "@/components/map/BogorMap";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header Utama SIJAGO */}
      <header className="bg-sijago-primary text-white border-b border-blue-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-blue-900/70 px-2.5 py-0.5 rounded-full mb-1">
              MIA2026 • Civic-Tech & Weather-Road Intelligence
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              SIJAGO — Sistem Jalan Bogor
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline-block bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 px-3 py-1 rounded-full">
              Human-in-the-Loop AI Ready
            </span>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <section className="max-w-6xl mx-auto w-full px-4 py-6 space-y-6 flex-1">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Peta Pemantauan Kerusakan Jalan & Korelasi Cuaca Kota Bogor
            </h2>
            <p className="text-sm text-slate-600">
              Laporkan jalan berlubang tanpa perlu daftar akun, tinjau draf dengan bantuan AI{" "}
              <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs">
                ✨ [Draf Dibantu AI]
              </code>
              , dan pantau tindak lanjut perbaikan secara transparan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ✨ [Draf Dibantu AI]
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              📄 [Draf Template]
            </span>
          </div>
        </div>

        {/* Peta MapLibre GL JS + OpenStreetMap */}
        <BogorMap />

        {/* Disclaimer Wajib (BRD & UI/UX Guide) */}
        <p className="text-xs text-slate-500 text-center">
          SIJAGO adalah platform partisipasi dan pengawasan warga. Waktu pelaksanaan perbaikan fisik
          sepenuhnya menjadi kewenangan instansi terkait.
        </p>
      </section>
    </main>
  );
}
