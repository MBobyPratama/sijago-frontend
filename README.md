<p align="center">
  <img src="public/images/logo_header_dark.svg" alt="Logo SIJAGO — Sistem Jalan Bogor" width="320" />
</p>

# SIJAGO - Sistem Jalan Bogor

SIJAGO adalah website pelaporan kerusakan jalan di Kota Bogor yang membantu warga mengirim laporan tanpa perlu membuat akun, melihat lokasi kerusakan di peta interaktif, dan memantau tindak lanjut perbaikan secara transparan. Admin memverifikasi, memeriksa potensi laporan duplikat, dan meneruskan laporan sesuai kewenangan ruas jalan, sedangkan instansi terkait memperbarui perkembangan penanganan melalui dashboard.

## Deployment

- **FE (Vercel):** [sijago-frontend.vercel.app](https://sijago-frontend.vercel.app/)
- **BE (Render):** [sijago-backend.onrender.com](https://sijago-backend.onrender.com)

## Akun Demo

Untuk mencoba dashboard, buka [halaman login SIJAGO](https://sijago-frontend.vercel.app/login) dan gunakan akun dummy berikut:

| Peran | Nama / Instansi | Email | Kata sandi |
| --- | --- | --- | --- |
| Admin | Administrator SIJAGO | `admin@sijago.com` | `ADMINSIJAGO123` |
| Instansi (Jalan Kota) | Dinas PUPR Kota Bogor | `dpupr@kotabogor.go.id` | `PUPRKOTABOGOR123` |
| Instansi (Jalan Provinsi) | Dinas Bina Marga dan Penataan Ruang (DBMPR) Provinsi Jawa Barat | `dbmpr@jabarprov.go.id` | `DBMPR123` |
| Instansi (Jalan Nasional) | BBPJN DKI Jakarta–Jawa Barat | `bbpjn_jktjabar@pu.go.id` | `BBPJN123` |

Akun admin digunakan untuk mencoba moderasi laporan, pemeriksaan duplikat, penerusan ke instansi, audit, dan pengaturan sistem. Ketiga akun instansi digunakan untuk mencoba pengelolaan laporan sesuai kewenangan ruas jalan masing-masing (Dinas PUPR Kota Bogor, DBMPR Provinsi Jawa Barat, dan BBPJN DKI Jakarta–Jawa Barat). Seluruh akun di atas merupakan akun demonstrasi; alamat instansi pada akun demo tidak menyatakan adanya kerja sama resmi.

## Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, HTML, CSS, Tailwind CSS |
| Peta | MapLibre GL JS, OpenFreeMap / OpenStreetMap |
| Grafik dan ikon | Recharts, Lucide React |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL di Neon, PostGIS, Drizzle ORM |
| AI & Moderasi Visual | OpenAI (`omni-moderation-latest` & Vision/Text JSON Schema) |
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
- `OPENAI_API_KEY`: digunakan untuk 4 fitur AI aktif (pemeriksaan keamanan & relevansi foto jalan, analisis saran isian dari foto, saran perbandingan duplikat laporan untuk admin, serta ringkasan pola antrean laporan untuk petugas instansi). Penyusunan draf laporan warga menggunakan template deterministik sehingga pengiriman laporan tetap berjalan meskipun AI dinonaktifkan.
- `CLOUDINARY_*`: kredensial untuk mengunggah dan menampilkan foto laporan.
- `RESEND_API_KEY` dan `RESEND_FROM_EMAIL`: untuk pengiriman tanda terima tiket, OTP pemulihan tiket, dan eskalasi email ke instansi.

Jangan memasukkan file `.env` atau kredensial ke repository.

Pada database yang akan digunakan, jalankan migrasi, inisialisasi data master, serta seeding akun dan laporan contoh, kemudian mulai server:

```powershell
# (Opsional) Reset database jika ingin mengosongkan seluruh data lama
npm run db:reset

# Migrasi skema & inisialisasi data master instansi
npm run db:migrate
npm run db:seed

# Buat 4 akun demo (1 Admin + 3 Instansi) dan 11 laporan contoh (SJG-2026-4101 s.d. SJG-2026-4111)
npm run db:seed:accounts
npm run db:seed:reports

# Jalankan server backend (http://localhost:4000/v1)
npm run dev
```

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

### 4. Seeding akun portal dan data laporan contoh

Di folder `sijago-backend`, tersedia skrip seeding terpisah sesuai kebutuhan:

- `npm run db:seed`: menyiapkan data master 3 instansi (PUPR Kota Bogor, DBMPR Jabar, BBPJN DKI Jakarta–Jawa Barat), konfigurasi sistem, dan proteksi trigger audit log.
- `npm run db:seed:accounts`: membuat ke-4 akun demo (1 Admin + 3 Instansi) secara otomatis. Alternatif manual melalui SQL Editor Neon juga tersedia pada `sijago-backend/sql/create-portal-account.sql` dan `sijago-backend/sql/README-auth.md`.
- `npm run db:seed:reports`: membuat **11 laporan contoh** dengan kode tiket asli (`SJG-2026-4101` s.d. `SJG-2026-4111`) menggunakan foto dari `public/images/example/`. Tiga laporan pertama (`SJG-2026-4101`, `SJG-2026-4102`, `SJG-2026-4103`) ditempatkan berdekatan (~12 meter di Jl. Ir. H. Juanda / Pintu 1 Kebun Raya Bogor) untuk menguji fitur deteksi laporan sekitar dan penggabungan duplikat.

Setelah akun dibuat, buka `/login` atau gunakan tautan **Masuk admin & instansi** di footer. Dashboard dilindungi autentikasi dan akses berbasis peran.

## Progress Saat Ini

- **Halaman warga:** homepage dengan hero, peta laporan interaktif (MapLibre GL JS), filter pencarian, statistik ringkas, FAQ, dan footer.
- **Pelaporan warga (tanpa login):** unggah foto dengan pemeriksaan keamanan & relevansi jalan otomatis (**AI Photo Safety & Road Relevance Gate**), fitur **Saran Isian dari Foto (AI Damage Photo Analysis)** untuk membantu mengisi kategori, kelas ukuran, dan deskripsi kondisi awal, deteksi laporan berdekatan (radius PostGIS) dengan opsi mendukung (*upvote*) laporan yang sudah ada, pemilihan lokasi via GPS atau pin peta, serta pengiriman laporan dengan draf template deterministik.
- **Pelacakan, pemulihan tiket, dan detail:** pencarian kode tiket (`SJG-2026-XXXX`), pemulihan kode tiket melalui OTP email bagi pelapor yang mencantumkan email, kronologi status penanganan, foto bukti sebelum/sesudah perbaikan, dukungan warga (*upvote*), *condition tags* terverifikasi email, *Community Sign-Off* (masa pemantauan 30 hari pasca-perbaikan), serta cetak lembar laporan resmi ke PDF melalui browser.
- **Dashboard admin:** moderasi antrean berpaginasi, verifikasi dan pembatalan verifikasi dengan alasan, penolakan laporan, fitur **Saran Duplikat AI (AI Duplicate Report Comparison)** untuk membandingkan bukti visual & jarak kandidat laporan dalam radius 100 meter sebelum penggabungan tiket (*merge*), penerusan laporan ke instansi sesuai kewenangan ruas jalan (Kota, Provinsi, Nasional), log audit berantai (*tamper-evident*), dan pengaturan sistem.
- **Dashboard instansi:** daftar laporan sesuai kewenangan masing-masing instansi, fitur **Ringkasan Pola Antrean AI (AI Agency Queue Pattern Summarizer)** untuk merangkum pola keluhan warga lintas laporan beserta sitasi tiket sumber, pembaruan status penanganan (`DIPROSES` / `SELESAI`), unggah bukti perbaikan (*after photo*), pengembalian laporan salah kewenangan ke admin, dan *Weather-Road Intelligence*.
- **Autentikasi & keamanan:** login, logout, sesi server PostgreSQL dengan cookie `HttpOnly`, proteksi API/dashboard berbasis peran, pembatasan cakupan akses laporan per instansi, perlindungan anti-bot Cloudflare Turnstile, serta proteksi *audit log* dengan rantai hash SHA-256.
- **Antarmuka & panduan desain:** layout responsif, tema **Klasik, Biru, dan Gelap**, maskot SIJAGO, pratinjau foto di dalam website, serta halaman acuan desain lengkap **Theme Guide** (`/theme-guide` dan `/admin/theme-guide`).

Project masih dalam pengembangan untuk **MIA2026**. Skor prioritas saat ini menggunakan kelas ukuran kerusakan dan dukungan warga; perhitungan berbobot berdasarkan kategori, dampak, umur laporan, dan curah hujan belum diterapkan sepenuhnya. Kerja sama serta tindak lanjut instansi dalam konteks kompetisi masih merupakan simulasi, dan fitur layanan eksternal memerlukan konfigurasi yang valid.

## Contributors

- **Sabira Putri Cahyani**
- **Muhammad Boby Pratama**
