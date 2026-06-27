// client/components/poster-upload.js
// Komponen drop zone upload poster film
// Dipanggil dari script.js saat modal dibuka dalam mode edit

// ─────────────────────────────────────────────
// STATE lokal komponen
// ─────────────────────────────────────────────
let _filmId        = null;   // ID film yang sedang diedit
let _currentPath   = null;   // cover_path saat ini dari DB
let _onUploaded    = null;   // callback(newPath) setelah upload berhasil
let _onDeleted     = null;   // callback() setelah poster dihapus

// ─────────────────────────────────────────────
// REFS elemen
// ─────────────────────────────────────────────
const section     = () => document.getElementById('posterUploadSection');
const dropzone    = () => document.getElementById('posterDropzone');
const fileInput   = () => document.getElementById('posterFileInput');
const previewImg  = () => document.getElementById('posterPreviewImg');
const placeholder = () => document.getElementById('posterDropzonePlaceholder');
const overlay     = () => document.getElementById('posterDropzoneOverlay');
const meta        = () => document.getElementById('posterUploadMeta');
const uploadName  = () => document.getElementById('posterUploadName');
const removeBtn   = () => document.getElementById('posterRemoveBtn');
const progress    = () => document.getElementById('posterProgress');
const progressBar = () => document.getElementById('posterProgressBar');

// ─────────────────────────────────────────────
// INIT — dipanggil sekali saat DOMContentLoaded
// ─────────────────────────────────────────────
export function initPosterUpload({ onUploaded, onDeleted } = {}) {
  _onUploaded = onUploaded || null;
  _onDeleted  = onDeleted  || null;

  // Klik zona → buka file picker
  dropzone()?.addEventListener('click', (e) => {
    // Jangan trigger jika klik di overlay "Ganti Poster"
    if (e.target.closest('.poster-change-overlay')) return;
    fileInput()?.click();
  });

  // Klik overlay "Ganti Poster" (saat sudah ada gambar)
  dropzone()?.addEventListener('click', (e) => {
    if (e.target.closest('.poster-change-overlay')) {
      fileInput()?.click();
    }
  });

  // File dipilih via file picker
  fileInput()?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input agar file yang sama bisa dipilih ulang
    e.target.value = '';
  });

  // Drag events
  const dz = dropzone();
  if (dz) {
    dz.addEventListener('dragenter', onDragEnter);
    dz.addEventListener('dragover',  onDragOver);
    dz.addEventListener('dragleave', onDragLeave);
    dz.addEventListener('drop',      onDrop);
  }

  // Tombol hapus poster
  removeBtn()?.addEventListener('click', handleDelete);
}

// ─────────────────────────────────────────────
// OPEN — dipanggil setiap kali modal dibuka
// filmId null  = mode tambah baru (sembunyikan section)
// filmId valid = mode edit (tampilkan section)
// ─────────────────────────────────────────────
export function openPosterUpload(filmId, currentCoverPath) {
  _filmId      = filmId      || null;
  _currentPath = currentCoverPath || null;

  const sec = section();
  if (!sec) return;

  // Sembunyikan section jika film belum punya ID (mode tambah baru)
  if (!_filmId) {
    sec.style.display = 'none';
    return;
  }

  sec.style.display = 'block';

  // Tampilkan poster jika sudah ada
  if (_currentPath) {
    showPreview(_currentPath, _currentPath.split('/').pop());
  } else {
    resetToPlaceholder();
  }
}

// ─────────────────────────────────────────────
// RESET — dipanggil saat modal ditutup
// ─────────────────────────────────────────────
export function resetPosterUpload() {
  _filmId      = null;
  _currentPath = null;

  const sec = section();
  if (sec) sec.style.display = 'none';

  resetToPlaceholder();
  hideProgress();
}

// ─────────────────────────────────────────────
// HANDLE FILE — validasi lalu upload
// ─────────────────────────────────────────────
async function handleFile(file) {
  // Validasi tipe
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!ALLOWED.includes(file.type)) {
    showUploadError('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.');
    return;
  }

  // Validasi ukuran (5 MB)
  if (file.size > 5 * 1024 * 1024) {
    showUploadError('Ukuran file terlalu besar. Maksimal 5 MB.');
    return;
  }

  // Tampilkan preview lokal sebelum upload
  const localUrl = URL.createObjectURL(file);
  showPreview(localUrl, file.name);
  showProgress(0);
  setDropzoneUploading(true);

  try {
    const newPath = await uploadToServer(file);

    // Preview berhasil — ganti dengan URL dari server
    URL.revokeObjectURL(localUrl);
    showPreview(newPath, file.name);
    _currentPath = newPath;

    // Update field cover_path di form juga (sinkron visual)
    const coverPathInput = document.getElementById('field_cover_path');
    if (coverPathInput) coverPathInput.value = newPath;

    _onUploaded?.(newPath);
  } catch (err) {
    console.error('[posterUpload]', err);
    URL.revokeObjectURL(localUrl);

    // Kembalikan ke state sebelumnya jika upload gagal
    if (_currentPath) {
      showPreview(_currentPath, _currentPath.split('/').pop());
    } else {
      resetToPlaceholder();
    }

    showUploadError(err.message || 'Upload gagal. Coba lagi.');
  } finally {
    setDropzoneUploading(false);
    hideProgress();
  }
}

// ─────────────────────────────────────────────
// UPLOAD KE SERVER
// ─────────────────────────────────────────────
async function uploadToServer(file) {
  if (!_filmId) throw new Error('ID film tidak tersedia. Simpan film dulu sebelum upload poster.');

  const formData = new FormData();
  formData.append('poster', file);

  // Simulasi progress — XHR dipakai biar bisa track progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        showProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.success) {
          resolve(json.cover_path);
        } else {
          reject(new Error(json.message || 'Upload gagal.'));
        }
      } catch {
        reject(new Error('Response server tidak valid.'));
      }
    });

    xhr.addEventListener('error',  () => reject(new Error('Koneksi ke server gagal.')));
    xhr.addEventListener('abort',  () => reject(new Error('Upload dibatalkan.')));
    xhr.addEventListener('timeout',() => reject(new Error('Upload timeout.')));

    xhr.open('POST', `/api/movies/${_filmId}/poster`);
    xhr.timeout = 30000; // 30 detik
    xhr.send(formData);
  });
}

// ─────────────────────────────────────────────
// HANDLE DELETE poster
// ─────────────────────────────────────────────
async function handleDelete() {
  if (!_filmId || !_currentPath) return;

  const konfirmasi = confirm('Hapus poster film ini?\nFile akan dihapus permanen dari server.');
  if (!konfirmasi) return;

  try {
    const res  = await fetch(`/api/movies/${_filmId}/poster`, { method: 'DELETE' });
    const json = await res.json();

    if (!json.success) throw new Error(json.message || 'Gagal menghapus poster.');

    _currentPath = null;
    resetToPlaceholder();

    // Kosongkan field cover_path di form
    const coverPathInput = document.getElementById('field_cover_path');
    if (coverPathInput) coverPathInput.value = '';

    _onDeleted?.();
  } catch (err) {
    console.error('[posterDelete]', err);
    alert('Gagal menghapus poster: ' + err.message);
  }
}

// ─────────────────────────────────────────────
// DRAG EVENTS
// ─────────────────────────────────────────────
function onDragEnter(e) {
  e.preventDefault();
  dropzone()?.classList.add('dragover');
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  dropzone()?.classList.add('dragover');
}

function onDragLeave(e) {
  // Hanya remove class jika meninggalkan zona (bukan ke child element)
  const dz = dropzone();
  if (dz && !dz.contains(e.relatedTarget)) {
    dz.classList.remove('dragover');
  }
}

function onDrop(e) {
  e.preventDefault();
  dropzone()?.classList.remove('dragover');

  const file = e.dataTransfer.files?.[0];
  if (file) handleFile(file);
}

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────
function showPreview(src, filename) {
  const dz = dropzone();
  const img = previewImg();
  const ph  = placeholder();
  const m   = meta();
  const n   = uploadName();

  if (img) {
    img.src           = src;
    img.style.display = 'block';
  }
  if (ph)  ph.style.display  = 'none';
  if (dz)  {
    dz.classList.add('has-image');
    // Tambahkan overlay "Ganti Poster" jika belum ada
    if (!dz.querySelector('.poster-change-overlay')) {
      dz.insertAdjacentHTML('beforeend', `
        <div class="poster-change-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Ganti Poster</span>
        </div>
      `);
    }
  }

  if (m)  m.style.display  = 'flex';
  if (n)  n.textContent    = filename || 'poster';
}

function resetToPlaceholder() {
  const dz  = dropzone();
  const img = previewImg();
  const ph  = placeholder();
  const m   = meta();

  if (img) { img.src = ''; img.style.display = 'none'; }
  if (ph)  ph.style.display  = 'flex';
  if (dz)  {
    dz.classList.remove('has-image', 'dragover', 'uploading');
    // Hapus overlay "Ganti Poster"
    dz.querySelector('.poster-change-overlay')?.remove();
  }
  if (m)   m.style.display  = 'none';
}

function showProgress(pct) {
  const p  = progress();
  const pb = progressBar();
  if (p)  p.style.display  = 'block';
  if (pb) pb.style.width   = `${pct}%`;
}

function hideProgress() {
  const p  = progress();
  const pb = progressBar();
  if (p)  p.style.display  = 'none';
  if (pb) pb.style.width   = '0%';
}

function setDropzoneUploading(on) {
  const dz = dropzone();
  if (dz) dz.classList.toggle('uploading', on);
}

function showUploadError(msg) {
  // Pakai toast dari window scope (diekspor oleh script.js)
  if (typeof window.showToastGlobal === 'function') {
    window.showToastGlobal(msg, 'error');
  } else {
    alert(msg);
  }
}