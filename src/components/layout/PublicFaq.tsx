import Link from "next/link";
import { Plus } from "lucide-react";
import "./public-faq.css";

export function PublicFaq() {
  return (
    <section className="public-faq" aria-labelledby="faq-heading" id="faq">
      <div className="pm-container public-faq-layout">
        <div className="public-faq-intro">
          <h2 id="faq-heading">Pertanyaan yang sering diajukan</h2>
          <p>Kenali cara melapor dan memantau perbaikan jalan melalui SIJAGO.</p>
        </div>
        <div className="public-faq-list">
          <details>
            <summary>Apakah saya perlu akun untuk melapor?<Plus aria-hidden="true" size={20} /></summary>
            <div className="public-faq-answer"><p>Tidak. Anda bisa melaporkan jalan rusak tanpa membuat akun. Email bersifat opsional jika Anda ingin menerima notifikasi perkembangan laporan.</p></div>
          </details>
          <details>
            <summary>Apa saja yang perlu disiapkan untuk melapor?<Plus aria-hidden="true" size={20} /></summary>
            <div className="public-faq-answer"><p>Siapkan 1 hingga 3 foto kerusakan, titik lokasi di Kota Bogor, kategori kerusakan, estimasi ukuran, dan patokan lokasi. Jika GPS tidak tersedia, Anda dapat memilih titik secara manual di peta.</p><Link href="/lapor">Buat laporan</Link></div>
          </details>
          <details>
            <summary>Mengapa laporan saya belum tampil di peta?<Plus aria-hidden="true" size={20} /></summary>
            <div className="public-faq-answer"><p>Laporan yang baru dikirim masuk ke antrean verifikasi Admin. Hanya laporan yang sudah diverifikasi yang tampil di peta publik. Periksa perkembangan laporan melalui kode tiket Anda.</p></div>
          </details>
          <details>
            <summary>Bagaimana cara melacak laporan saya?<Plus aria-hidden="true" size={20} /></summary>
            <div className="public-faq-answer"><p>Simpan kode tiket dan tautan pelacakan yang diberikan setelah laporan terkirim. Buka halaman Lacak laporan untuk melihat status, instansi tujuan, dan bukti perbaikan jika sudah tersedia.</p><Link href="/lacak">Lacak laporan</Link></div>
          </details>
          <details>
            <summary>Sudah ada laporan di lokasi yang sama. Apa yang perlu saya lakukan?<Plus aria-hidden="true" size={20} /></summary>
            <div className="public-faq-answer"><p>Gunakan tombol “Saya lewat sini” pada laporan tersebut untuk memberi dukungan tanpa membuat laporan ganda. Dukungan dapat dibatalkan dan menjadi salah satu sinyal untuk membantu penentuan prioritas penanganan.</p></div>
          </details>
          <details>
            <summary>Siapa yang memperbaiki jalan dan kapan pengerjaannya?<Plus aria-hidden="true" size={20} /></summary>
            <div className="public-faq-answer"><p>Perbaikan fisik dan jadwal pengerjaan menjadi kewenangan instansi terkait. SIJAGO membantu warga melapor dan memantau tindak lanjut, tanpa menjanjikan waktu perbaikan. Untuk proyek MIA2026, kerja sama dengan instansi masih disimulasikan.</p></div>
          </details>
        </div>
      </div>
    </section>
  );
}
