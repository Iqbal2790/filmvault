# Refactoring FilmVault untuk Cloud & Multi-User

Rencana ini membagi proses migrasi aplikasi dari arsitektur "Lokal" (Express/SQLite) menjadi arsitektur "Serverless" (Supabase/TMDB) ke dalam **5 fase kecil bertahap** agar lebih mudah dieksekusi.

## User Review Required

> [!WARNING]
> **Penghapusan Backend Lama**
> Pada Fase 1, kita akan menghapus seluruh folder `server/`. Frontend akan langsung berkomunikasi dengan Supabase. Ini membuat aplikasi 100% kompatibel dengan Vercel. Apakah Anda setuju?

## Open Questions

> [!IMPORTANT]
> - **Google Auth & TMDB API:** Apakah Anda sudah memiliki akun Google Cloud Console (untuk setup OAuth) dan akun TMDB (untuk API Key)? Jika belum, Anda bisa membuatnya sambil kita mengerjakan Fase 1.
> - Apakah URL profil seperti `domain.com/?user=iqbal` sudah sesuai dengan preferensi Anda?

---

## 🛠️ Proposed Changes & Phases

### Fase 1: Cleanup & Persiapan Arsitektur Baru
Fase ini berfokus pada pembersihan kode lama dan persiapan koneksi ke Supabase.
- **[DELETE]** Folder `server/` secara keseluruhan (Backend Express, Multer, SQLite).
- **[MODIFY]** `package.json` untuk menghapus dependensi backend yang tidak dipakai.
- **[NEW]** Setup *database schema* di panel Supabase Anda:
  - Tabel `profiles` (id, username, is_public)
  - Tabel `movies` (id, user_id, tmdb_id, title, poster_url, status, rating, review)
- **[MODIFY]** Menambahkan SDK `@supabase/supabase-js` via CDN di `client/index.html`.
- **[NEW]** Membuat file `client/supabase-client.js` untuk menginisialisasi koneksi Supabase.

### Fase 2: Sistem Autentikasi (Login)
Fase ini berfokus pada pendaftaran dan login user.
- **[MODIFY]** `client/index.html`: Menambahkan area/modal untuk tombol "Login with Google" dan "Logout".
- **[MODIFY]** `client/script.js`: Menambahkan logika listener *Auth State* (Mendeteksi apakah user sedang login atau belum). Jika belum login, sembunyikan grid film dan tampilkan tombol login.
- **[MODIFY]** Memastikan bahwa setelah login pertama kali, data profil user otomatis masuk ke tabel `profiles`.

### Fase 3: Integrasi TMDB API (Pencarian & Penambahan Film)
Fase ini menggantikan input manual menjadi otomatis dengan API.
- **[MODIFY]** `client/components/search-bar.js`: Saat mengetik di search bar, aplikasi akan *fetch* data dari TMDB API.
- **[MODIFY]** `client/components/poster-upload.js` akan **[DELETE]** atau dirombak, karena poster kini otomatis ditarik dari TMDB (URL gambar), sehingga menghemat *storage*.
- **[MODIFY]** Menambahkan fungsi untuk menyimpan film hasil pencarian ke tabel `movies` di Supabase.

### Fase 4: Migrasi Fitur Utama (Read, Update, Delete)
Fase ini mengembalikan fungsi utama aplikasi dengan database baru.
- **[MODIFY]** `client/script.js`: Menarik daftar film milik user dari Supabase dan menampilkannya di Grid.
- **[MODIFY]** `client/components/movie-card.js`: Menambahkan tampilan *Rating Bintang (1-5)* dan *Status Tontonan (Plan/Watched/Dropped)*, tidak lagi sekadar Approve/Unapprove.
- **[MODIFY]** Mengaktifkan kembali fungsi *Edit* dan *Delete* yang kini langsung menembak ke Supabase.

### Fase 5: Profil Publik & Polish UI
Fase ini membuat aplikasi bersifat sosial dan siap untuk publik.
- **[MODIFY]** `client/script.js`: Menambahkan logika deteksi parameter URL `?user=xyz`. Jika ada, maka tarik data film dari user `xyz` (hanya jika `is_public` bernilai `true`). Di mode ini, fungsi *Edit/Delete* akan disembunyikan.
- **[MODIFY]** Menambahkan pengaturan akun di UI agar user bisa mengubah `username` dan me-toggle status `is_public`.
- **[MODIFY]** `client/style.css`: Menambahkan *media queries* (opsional) agar tampilan lebih pas saat dibuka dari HP.

---

## Verification Plan

Setelah kelima fase selesai, kita akan memverifikasinya melalui:
1. **Local Test**: Menjalankan *Live Server* dan mengetes *flow* penuh dari Login (Google) -> Cari Film (TMDB) -> Tambah ke List -> Edit Rating -> Logout.
2. **Public View Test**: Membuka `?user=[username]` di browser *Incognito* untuk memverifikasi fitur profil publik dan mengonfirmasi Guest tidak bisa mengedit data.
3. **Deployment**: Upload ke GitHub dan Deploy ke Vercel tanpa proses *build* yang rumit.
