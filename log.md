# FilmVault — Development Log

> Log progress pengerjaan project database film lokal.
> Diperbarui setiap phase selesai.

---

## Info Project

| Key | Value |
|-----|-------|
| Nama Project | FilmVault |
| Tech Stack | Node.js, Express.js, SQLite, Vanilla JS |
| Lokasi | `D:\database-claude` |
| Node Version | v24.15.0 |
| Dimulai | 21 Mei 2026 |

---

## ✅ Phase 1 — Project Setup
**Status:** Selesai
**Tanggal:** 21 Mei 2026

**File yang dibuat:**
- `package.json` — konfigurasi project dan dependencies
- `server/server.js` — Express server dasar dengan health check endpoint
- `prototype.html` — prototype desain UI (diletakkan di root folder)

**Dependencies yang terinstall:**
- `express` ^4.18.3
- `better-sqlite3` ^11.9.1 *(di-upgrade dari 9.4.3 karena tidak kompatibel dengan Node v24)*
- `cors` ^2.8.5
- `nodemon` ^3.1.0 (devDependency)

**Catatan & Kendala:**
- PowerShell memblokir `npm run dev` karena execution policy — solusi: jalankan lewat CMD atau aktifkan `RemoteSigned` policy
- `better-sqlite3` v9.4.3 gagal compile di Node v24 karena error C++20 — solusi: upgrade ke v11.9.1
- Perintah `rd /s /q` tidak bisa dijalankan di PowerShell — gunakan `Remove-Item -Recurse -Force node_modules`
- PORT server disesuaikan (default 3000, bisa diganti di `server/server.js`)

**Verifikasi:**
- `http://localhost:4000/api/health` → `{ "status": "ok", "message": "FilmVault server berjalan" }` ✅

---

## ✅ Phase 2 — Database & Model
**Status:** Selesai
**Tanggal:** 21 Mei 2026

**File yang dibuat:**
- `server/database/init.js` — inisialisasi tabel SQLite, dijalankan otomatis saat server start
- `server/models/movieModel.js` — semua fungsi CRUD film terpusat

**Fungsi tersedia di movieModel.js:**
- `getAllMovies()` — ambil semua film, urut A-Z
- `getMovieById(id)` — ambil 1 film by ID
- `createMovie(data)` — tambah film baru (field `title` wajib)
- `updateMovie(id, data)` — update partial, hanya field yang dikirim
- `deleteMovie(id)` — hapus film, return data yang dihapus
- `setApproveStatus(id, status)` — toggle approved: terima `true/false`, `1/0`

**Skema tabel `movies`:**
- Identitas: `id`, `title`, `local_title`, `year`, `duration`, `country`, `studio`
- Konten: `genre`, `synopsis`, `director`, `actor`, `tag`, `rating`
- Path: `cover_path`, `background_path`, `file_path`, `subtitle_path`
- Status: `approved` (0/1), `added_date` (auto datetime)

**Catatan:**
- WAL mode diaktifkan untuk performa read/write lebih baik
- Semua field aman dari SQL injection via parameterized query

**Verifikasi:**
- `node server/database/init.js` → tabel berhasil dibuat ✅
- `node test-model.js` → semua fungsi CRUD berjalan benar ✅

---

## ✅ Phase 3 — REST API
**Status:** Selesai
**Tanggal:** 21 Mei 2026

**File yang dibuat:**
- `server/controllers/movieController.js` — handler untuk setiap endpoint
- `server/routes/movieRoutes.js` — definisi semua endpoint film
- `server/server.js` — diperbarui, routes dan 404 handler terdaftar

**Endpoint tersedia:**

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/api/movies` | Ambil semua film |
| `GET` | `/api/movies/:id` | Ambil 1 film by ID |
| `POST` | `/api/movies` | Tambah film baru |
| `PUT` | `/api/movies/:id` | Update data film |
| `DELETE` | `/api/movies/:id` | Hapus film |
| `PATCH` | `/api/movies/:id/approve` | Toggle status approved |

**Catatan & Kendala:**
- Error "Route tidak ditemukan" saat pertama test — penyebab: server belum di-restart setelah file diupdate
- Solusi: stop server (`Ctrl+C`) lalu `npm run dev` ulang

**Verifikasi:**
- `GET /api/movies` → `{ success: true, total: 1, data: [...] }` ✅
- Response JSON lengkap dengan semua field skema ✅
- `approved` dan `added_date` terisi otomatis ✅

---

## ✅ Phase 4 — Search & Sorting (Backend)
**Status:** Selesai
**Tanggal:** 21 Mei 2026

**File yang dibuat/diperbarui:**
- `server/models/movieModel.js` — tambah fungsi `searchMovies()` dan `SORT_MAP`
- `server/controllers/movieController.js` — `getAll` sekarang baca query params
- `server/database/seed.js` — 50 data dummy film

**Query params tersedia di `GET /api/movies`:**

| Param | Contoh | Keterangan |
|-------|--------|-----------|
| `search` | `?search=nolan` | Cari di title, genre, actor, director, tag, year |
| `sort` | `?sort=rating` | `title_asc`, `title_desc`, `year`, `rating`, `added_date`, `approved` |
| `approved` | `?approved=1` | Filter `0` atau `1` |
| `letter` | `?letter=A` | Filter huruf awal, `#` untuk non-alfabet |

**Catatan & Kendala:**
- Error `SqliteError: no such column: "movies"` — penyebab: query `sqlite_sequence` pakai tanda kutip ganda
- Ada karakter apostrof di nama film yang menyebabkan error — solusi: hapus apostrof dari data seed
- Seed harus dijalankan via CMD, bukan PowerShell

**Verifikasi:**
- `node server/database/seed.js` → 50 film berhasil masuk ✅
- `GET /api/movies?search=nolan` → hanya film Christopher Nolan ✅
- `GET /api/movies?sort=rating` → urut rating tertinggi ✅
- `GET /api/movies?letter=D` → hanya film berawalan D ✅
- `GET /api/movies?approved=0` → hanya film belum di-approve ✅

---

## ✅ Phase 5 — Frontend Dasar
**Status:** Selesai (diulang dari awal)
**Tanggal:** 23 Mei 2026

> ⚠️ Phase ini dikerjakan ulang dari nol. File lama dari iterasi pertama digantikan seluruhnya.
> Desain mengikuti `prototype3.html` (warm neutral palette, Syne + IBM Plex Sans + IBM Plex Mono).
> Alphabet navigation tidak dimasukkan di phase ini — akan dikerjakan di Phase 7 sesuai rencana.

**File yang dibuat/diganti:**
- `client/index.html` — struktur halaman utama: topnav dengan tab filter, toolbar dengan search + sort, stats strip, area grid film, detail drawer, modal tambah/edit
- `client/style.css` — styling lengkap sesuai prototype3.html: CSS variables, topnav, toolbar, stats tiles, card grid, drawer, modal, loading state, empty state, responsive breakpoints
- `client/script.js` — state terpusat, fetch API, render grid per huruf, drawer detail, modal tambah/edit, toggle approve, hapus film, debounce search, sync sort, escape key handler
- `client/components/movie-card.js` — komponen card dengan inisial placeholder, poster image support, status dot, rating badge, hover actions (edit & hapus)

**Fitur yang berjalan:**
- 4 stat tile otomatis dari API (total, approved, perlu review, rata-rata rating)
- Nav tabs: Semua / Approved / Perlu Review (filter langsung ke API)
- Sort buttons desktop + sort dropdown mobile, sinkron dua arah
- Search realtime dengan debounce 300ms + tombol clear + Escape key
- Grid film dikelompokkan otomatis per huruf awal (A, B, C, …, #)
- Card film: initials placeholder, status dot (hijau/merah), rating badge, hover actions
- Stagger animasi saat card muncul
- Detail drawer slide dari kanan: sinopsis, detail produksi, pemeran, tags, path file
- Toggle approve/unapprove langsung dari drawer (hit API + refresh grid)
- Modal tambah film baru dan edit metadata (semua field skema)
- Tombol hapus dengan konfirmasi native
- Loading state dan empty state dengan tombol reset filter
- Escape key menutup drawer/modal

**Verifikasi:**
- `http://localhost:4000` → halaman tampil dengan data dari API ✅
- 4 stat tile terisi otomatis ✅
- Card muncul berkelompok per huruf ✅
- Klik card → drawer terbuka dengan detail lengkap ✅
- Toggle approve di drawer → update langsung ke DB ✅
- Tambah film baru via modal → muncul di grid ✅
- Sort dan search berfungsi ✅

---

## ⏳ Phase 6 — Search & Sorting (Frontend)
**Status:** Belum dimulai

---

## ⏳ Phase 7 — Alphabet Navigation
**Status:** Belum dimulai

---

## ⏳ Phase 8 — Metadata Form (Add & Edit)
**Status:** Belum dimulai

---

## ⏳ Phase 9 — Polish & QA
**Status:** Belum dimulai

---

*Log ini akan diperbarui setiap phase selesai.*