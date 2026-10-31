# SIJAGO - Sistem Jalan Bogor

SIJAGO adalah website pelaporan kerusakan jalan di Kota Bogor yang membantu warga mengirim laporan, melihat lokasi kerusakan, dan memantau tindak lanjut perbaikan. Admin memverifikasi dan meneruskan laporan, sedangkan instansi memperbarui perkembangan penanganan melalui dashboard.

## Deployment

- **FE (Vercel):** [sijago-frontend.vercel.app](https://sijago-frontend.vercel.app/)
- **BE (Render):** [sijago-backend.onrender.com](https://sijago-backend.onrender.com)

## Contributors

- **Sabira Putri Cahyani**
- **Muhammad Boby Pratama**

## Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, HTML, CSS, Tailwind CSS |
| Peta | MapLibre GL JS, OpenFreeMap / OpenStreetMap |
| Grafik dan ikon | Recharts, Lucide React |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL di Neon, PostGIS, Drizzle ORM |
| Penyimpanan foto | Cloudinary |
| Email | Resend |
| Data cuaca | Open-Meteo dan BMKG |
| Autentikasi | Sesi server PostgreSQL, cookie HttpOnly, hash kata sandi bcrypt melalui pgcrypto |

Tampilan menggunakan font **Plus Jakarta Sans**, identitas warna SIJAGO, dan pilihan tema **Klasik, Biru, serta Gelap**.

## Cara Menjalankan Project

### 1. Persiapan dan clone

Siapkan **Node.js 22**, npm, Git, serta database PostgreSQL/Neon yang mendukung ekstensi `postgis` dan `pgcrypto`.

Frontend dan backend berada di repository terpisah. Clone keduanya dalam satu folder kerja:

```powershell
mkdir MIA2026
cd MIA2026
git clone https://github.com/MBobyPratama/sijago-frontend.git
git clone https://github.com/MBobyPratama/sijago-backend.git
```

### 2. Install dan jalankan backend

```powershell
cd sijago-backend
npm install
Copy-Item .env.example .env
```

Isi `.env` menggunakan konfigurasi Anda sendiri:

- `DATABASE_URL`: connection string database Neon/PostgreSQL.
- `PORT=4000` dan `FRONTEND_URL=http://localhost:3000` untuk pengembangan lokal.
- `PSEUDONYM_HASH_SALT` dan nilai secret lain pada file contoh: ganti dengan nilai acak milik Anda.
- `CLOUDINARY_*`: kredensial untuk mengunggah dan menampilkan foto laporan.
- `RESEND_API_KEY` dan `RESEND_FROM_EMAIL`: untuk fitur email dan OTP. Pengiriman ke instansi juga membutuhkan alamat email resmi instansi yang sudah dikonfigurasi.

Jangan memasukkan file `.env` atau kredensial ke repository. Integrasi OpenAI tersedia pada backend, tetapi alur pelaporan warga saat ini memakai draf template dan tidak membutuhkan pembuatan laporan dengan AI.

Pada database yang akan digunakan, jalankan migrasi dan inisialisasi data master, kemudian mulai server:

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

Seed hanya menyiapkan data master instansi, konfigurasi sistem, dan proteksi audit; tidak membuat laporan dummy maupun akun login bawaan. API berjalan pada `http://localhost:4000/v1`.

### 3. Install dan jalankan frontend

Buka terminal kedua dari folder kerja `MIA2026`:

```powershell
cd sijago-frontend
npm install
Copy-Item .env.example .env.local
```

Pastikan konfigurasi berikut sesuai dengan server lokal:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=nama_cloud_anda
```

Jalankan frontend:

```powershell
npm run dev
```

Buka **http://localhost:3000**. Jika port tersebut sedang digunakan, Next.js dapat memilih port lain; periksa URL pada terminal dan sesuaikan konfigurasi URL frontend bila diperlukan.

### 4. Buat akun admin atau instansi

Akun dibuat melalui SQL Editor Neon menggunakan [query pembuatan akun](sijago-backend/sql/create-portal-account.sql). Isi email, nama, kata sandi, dan peran pada variabel query; untuk petugas instansi, isi juga kode instansinya. Petunjuk tersedia di [panduan autentikasi](sijago-backend/sql/README-auth.md).

Setelah akun dibuat, buka `/login` atau gunakan tautan **Masuk admin & instansi** di footer. Dashboard dilindungi autentikasi dan akses berbasis peran.

## Progress Saat Ini

- **Halaman warga:** homepage dengan hero, peta laporan, filter pencarian, FAQ, dan footer.
- **Pelaporan:** unggah foto, pilih lokasi dengan klik peta atau geser pin, isi data kerusakan, lalu tinjau dan kirim menggunakan draf template.
- **Pelacakan dan detail:** pencarian kode tiket, status penanganan, foto bukti, dukungan warga, Community Sign-Off, serta cetak lembar laporan ke PDF melalui browser.
- **Dashboard admin:** moderasi, verifikasi dan pembatalannya dengan alasan, penolakan, penggabungan laporan duplikat, penerusan ke instansi, audit, dan pengaturan sistem.
- **Dashboard instansi:** daftar laporan sesuai instansi, pembaruan status penanganan, unggah bukti perbaikan, pengembalian laporan ke admin, dan Weather-Road Intelligence.
- **Autentikasi:** login, logout, sesi server, proteksi API/dashboard, serta pembatasan akses laporan berdasarkan instansi.
- **Antarmuka:** layout responsif, tema Klasik/Biru/Gelap, maskot SIJAGO, dan preview foto di dalam website.

Project masih dalam pengembangan untuk **MIA2026**. Skor prioritas saat ini menggunakan kelas ukuran kerusakan dan dukungan warga; perhitungan berbobot berdasarkan kategori, dampak, umur laporan, dan curah hujan belum diterapkan sepenuhnya. Kerja sama serta tindak lanjut instansi dalam konteks kompetisi masih merupakan simulasi, dan fitur layanan eksternal memerlukan konfigurasi yang valid.
