# CLAUDE.md

# Project Overview

Project ini adalah web database film sederhana yang berjalan secara lokal (localhost only).

Tujuan utama project:
- Menyimpan database film pribadi berdasarkan referensi user
- Membantu user mengatur koleksi film dengan rapi
- Menyediakan pencarian dan navigasi cepat
- Menambahkan metadata film secara manual seperti sistem media library
- Menjadi latihan fullstack sederhana dengan struktur yang clean dan scalable

> Project ini bukan platform streaming dan bukan media server kompleks.
> Fokus utama adalah manajemen database film lokal.

---

# Tech Stack

| Layer    | Teknologi                     |
|----------|-------------------------------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend  | Node.js, Express.js           |
| Database | SQLite (via better-sqlite3)   |

---

# Folder Structure

```
project-root/
│
├── server/
│   ├── database/
│   │   └── database.sqlite
│   │
│   ├── routes/
│   │   └── movieRoutes.js
│   │
│   ├── controllers/
│   │   └── movieController.js
│   │
│   ├── models/
│   │   └── movieModel.js
│   │
│   ├── services/
│   │   └── metadataService.js
│   │
│   └── server.js
│
├── client/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   │
│   ├── components/
│   │   ├── movie-card.js
│   │   ├── search-bar.js
│   │   └── alphabet-nav.js
│   │
│   └── assets/
│       └── posters/
│
├── package.json
└── CLAUDE.md
```

---

# Main Features

## 1. Film Database
Menyimpan data film beserta:
- Daftar judul film
- Poster / path gambar
- Metadata tambahan
- Status approve / unapprove

---

## 2. Metadata System

Metadata film mengikuti konsep media library (mirip Jellyfin), diinput manual oleh user.

| Field              | Keterangan              |
|--------------------|-------------------------|
| `title`            | Judul asli              |
| `local_title`      | Judul lokal             |
| `year`             | Tahun rilis             |
| `genre`            | Genre film              |
| `synopsis`         | Sinopsis                |
| `director`         | Sutradara               |
| `actor`            | Pemeran                 |
| `rating`           | Rating                  |
| `duration`         | Durasi (menit)          |
| `country`          | Negara produksi         |
| `studio`           | Studio produksi         |
| `tag`              | Tag tambahan            |
| `cover_path`       | Path poster/cover       |
| `background_path`  | Path background image   |
| `file_path`        | Path file lokal         |
| `subtitle_path`    | Path file subtitle      |

---

## 3. Approve System

Setiap film memiliki status:

| Status       | Keterangan                         |
|--------------|------------------------------------|
| `approved`   | Film sudah dicek dan data valid    |
| `unapproved` | Film belum dicek atau perlu review |

Status approve harus langsung terlihat pada list data.

---

## 4. Sorting System

User bisa mengurutkan data berdasarkan:
- Abjad A-Z / Z-A
- Tanggal ditambahkan
- Tahun rilis
- Rating
- Status approve
- Custom sorting jika diperlukan

---

## 5. Quick Alphabet Navigation

Navigasi cepat berdasarkan huruf A–Z.
Klik huruf akan langsung scroll atau filter ke film dengan awalan huruf tersebut.

---

## 6. Search System

Search bar realtime yang bisa mencari berdasarkan:
- Judul film
- Tahun
- Genre
- Actor
- Metadata tertentu

Search harus cepat dan ringan.

---

# Working Mode

## Cara Claude Membantu Project Ini

Claude tidak bisa langsung menjalankan perintah di komputer kamu.
Setiap phase, Claude akan **menghasilkan semua file lengkap siap pakai** — kamu tinggal membuat file tersebut di komputer dan copy paste isinya.

---

## Aturan Wajib — Konfirmasi Per Phase

Claude WAJIB mengikuti aturan ini tanpa pengecualian:

1. **Kerjakan satu phase dalam satu waktu.** Jangan mulai phase berikutnya sebelum phase saat ini selesai.

2. **Setiap phase menghasilkan output berupa file lengkap** — bukan penjelasan saja. Semua kode harus siap di-copy paste langsung ke file.

3. **Setelah selesai satu phase, berhenti dan tampilkan ringkasan** dengan format ini:

```
✅ Phase [N] — [Nama Phase] selesai.

File yang perlu dibuat:
- [path/nama-file.js] — [keterangan singkat]
- [path/nama-file.js] — [keterangan singkat]

Langkah yang perlu dijalankan di terminal:
- [perintah jika ada, contoh: npm install]

Ketik "lanjut" jika semua file sudah dibuat dan siap ke Phase [N+1].
```

4. **Jangan lanjut ke phase berikutnya** sampai user mengetik "lanjut" atau konfirmasi eksplisit.

5. **Jika ada pertanyaan atau pilihan desain** di tengah phase, berhenti dan tanyakan dulu:

```
⚠️ Perlu keputusan di Phase [N]:
[deskripsi pertanyaan]

Pilihan:
A) [opsi A]
B) [opsi B]

Ketik A atau B untuk melanjutkan.
```

6. **Jangan skip checklist.** Setiap item `- [ ]` di dalam phase harus dihasilkan sebelum phase dianggap selesai.

---

## Cara Memulai

Ketik pesan berikut untuk memulai:

```
Mulai Phase 1
```

Claude akan langsung menghasilkan semua file untuk Phase 1 beserta instruksi cara menjalankannya.

---

# Development Phases

Pengerjaan project dibagi menjadi 9 fase bertahap.

---

## Phase 1 — Project Setup
**Goal:** Struktur folder dan server Express dasar siap berjalan.

**Output yang dihasilkan Claude:**
- [ ] `package.json` — dengan semua dependencies
- [ ] `server/server.js` — Express server dasar
- [ ] Instruksi `npm install` dan cara menjalankan server

---

## Phase 2 — Database & Model
**Goal:** Schema SQLite siap dan bisa diakses lewat model.

**Output yang dihasilkan Claude:**
- [ ] `server/database/init.js` — script inisialisasi tabel
- [ ] `server/models/movieModel.js` — fungsi CRUD lengkap:
  - `getAllMovies()`
  - `getMovieById(id)`
  - `createMovie(data)`
  - `updateMovie(id, data)`
  - `deleteMovie(id)`
  - `setApproveStatus(id, status)`

---

## Phase 3 — REST API
**Goal:** Semua endpoint film berfungsi dan siap ditest.

**Output yang dihasilkan Claude:**
- [ ] `server/controllers/movieController.js` — handler tiap route
- [ ] `server/routes/movieRoutes.js` — definisi endpoint:
  - `GET /api/movies`
  - `GET /api/movies/:id`
  - `POST /api/movies`
  - `PUT /api/movies/:id`
  - `DELETE /api/movies/:id`
  - `PATCH /api/movies/:id/approve`
- [ ] Update `server/server.js` — daftarkan routes

---

## Phase 4 — Search & Sorting (Backend)
**Goal:** Query SQLite support filter dan sort dinamis.

**Output yang dihasilkan Claude:**
- [ ] Update `server/models/movieModel.js` — tambah fungsi search & sort
- [ ] Update `server/controllers/movieController.js` — handle query params:
  - `?search=keyword`
  - `?sort=title_asc | title_desc | year | rating | added_date | approved`
- [ ] `server/database/seed.js` — 50 data dummy untuk testing

---

## Phase 5 — Frontend Dasar
**Goal:** UI dasar menampilkan daftar film dari API.

**Output yang dihasilkan Claude:**
- [ ] `client/index.html` — struktur halaman utama
- [ ] `client/style.css` — styling dasar
- [ ] `client/script.js` — fetch API dan render ke DOM
- [ ] `client/components/movie-card.js` — komponen card satu film

---

## Phase 6 — Search & Sorting (Frontend)
**Goal:** User bisa mencari dan mengurutkan film dari UI.

**Output yang dihasilkan Claude:**
- [ ] `client/components/search-bar.js` — input realtime dengan debounce
- [ ] Update `client/script.js` — integrasi search & sort ke fetch
- [ ] Update `client/index.html` — tambah elemen sort dropdown
- [ ] Update `client/style.css` — styling search dan sort

---

## Phase 7 — Alphabet Navigation
**Goal:** User bisa navigasi cepat berdasarkan huruf pertama judul.

**Output yang dihasilkan Claude:**
- [ ] `client/components/alphabet-nav.js` — render tombol A–Z
- [ ] Update `client/script.js` — integrasi filter by huruf
- [ ] Update `client/style.css` — styling alphabet nav + highlight aktif

---

## Phase 8 — Metadata Form (Add & Edit)
**Goal:** User bisa menambah dan mengedit metadata film dari UI.

**Output yang dihasilkan Claude:**
- [ ] Update `client/index.html` — tambah form add & edit film
- [ ] Update `client/script.js` — handler submit form, validasi input
- [ ] Update `client/style.css` — styling form
- [ ] `server/services/metadataService.js` — validasi data sebelum masuk DB

---

## Phase 9 — Polish & QA
**Goal:** Aplikasi siap dipakai secara nyaman.

**Output yang dihasilkan Claude:**
- [ ] Update semua file backend — tambah error handling konsisten
- [ ] Update semua file frontend — tambah loading state
- [ ] Checklist keamanan: parameterized query, sanitasi input
- [ ] Ringkasan final: cara menjalankan project dari awal

---

# Project Goals

## Main Goal
Membuat aplikasi database film lokal yang ringan, cepat, mudah digunakan, mudah dipelajari, dan mudah dikembangkan.

## Technical Goal
Belajar membangun:
- CRUD dengan SQLite
- REST API dengan Express.js
- Struktur backend yang bersih (routes / controllers / models / services)
- Pengelolaan metadata
- Search dan sorting system
- Frontend interaktif tanpa framework berat

## UX Goal
User harus bisa:
- Menemukan film dengan cepat
- Mengatur library dengan nyaman
- Mengedit metadata dengan mudah
- Menggunakan aplikasi tanpa koneksi internet

---

# Rules & Conventions

- Semua response API menggunakan format JSON
- HTTP status code harus tepat: `200`, `201`, `400`, `404`, `500`
- Gunakan parameterized query SQLite — tidak boleh string concatenation langsung
- Nama file dan folder menggunakan `camelCase` untuk JS, `kebab-case` untuk aset
- Tidak ada logika bisnis di `routes` — semua masuk ke `controller` atau `model`
- Komentar kode ditulis dalam Bahasa Indonesia
