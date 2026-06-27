// client/components/alphabet-nav.js
// Komponen navigasi alphabet A–Z
// Render tombol huruf, highlight huruf yang punya film, highlight huruf aktif saat scroll

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * initAlphabetNav({ containerId, onLetterClick })
 *
 * @param {string}   containerId   — id elemen container strip alphabet
 * @param {Function} onLetterClick — dipanggil saat huruf diklik: (letter | null) => void
 *                                   letter = 'A'–'Z' atau '#', null = reset
 *
 * @returns {Object} API publik: { update, setActive, reset }
 */
export function initAlphabetNav({ containerId, onLetterClick }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[AlphabetNav] Container #${containerId} tidak ditemukan.`);
    return null;
  }

  let activeLetter = null;

  // ── RENDER AWAL ──
  // Render semua tombol huruf + tombol '#' + span count
  container.innerHTML = '';

  const allLetters = [...LETTERS, '#'];

  allLetters.forEach(letter => {
    const btn = document.createElement('button');
    btn.className    = 'alpha-btn';
    btn.dataset.letter = letter;
    btn.textContent  = letter;
    btn.setAttribute('aria-label', letter === '#' ? 'Simbol / Angka' : `Huruf ${letter}`);
    btn.setAttribute('title', letter === '#' ? 'Simbol & Angka' : letter);

    btn.addEventListener('click', () => {
      if (activeLetter === letter) {
        // Klik huruf aktif → reset filter
        setActive(null);
        onLetterClick(null);
      } else {
        setActive(letter);
        onLetterClick(letter);
        scrollToSection(letter);
      }
    });

    container.appendChild(btn);
  });

  // Span count di ujung kanan
  const countSpan = document.createElement('span');
  countSpan.className = 'alpha-count';
  countSpan.id        = 'alphaCount';
  container.appendChild(countSpan);

  // ── SCROLL TO SECTION ──
  function scrollToSection(letter) {
    const section = document.getElementById(`section-${letter}`);
    if (!section) return;

    // Offset: tinggi topnav + toolbar + alpha-strip (~130px)
    const offset = 130;
    const top    = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // ── SET ACTIVE ──
  function setActive(letter) {
    activeLetter = letter;
    container.querySelectorAll('.alpha-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.letter === letter);
    });
  }

  // ── UPDATE — dipanggil setiap kali film di-render ──
  // films: array film yang saat ini ditampilkan
  // total: total film (untuk label count)
  function update(films, total) {
    // Hitung huruf yang ada film
    const occupied = new Set();
    (films || []).forEach(film => {
      const first = film.title?.[0]?.toUpperCase() || '#';
      const key   = /[A-Z]/.test(first) ? first : '#';
      occupied.add(key);
    });

    container.querySelectorAll('.alpha-btn').forEach(btn => {
      const letter = btn.dataset.letter;
      const has    = occupied.has(letter);
      btn.classList.toggle('has', has);
      btn.disabled = !has;
    });

    // Update count label
    const countEl = document.getElementById('alphaCount');
    if (countEl) {
      countEl.textContent = total != null ? `${total} film` : '';
    }

    // Jika huruf aktif tidak lagi punya film, reset tombol (tapi jangan reset filter)
    if (activeLetter && !occupied.has(activeLetter)) {
      container.querySelectorAll('.alpha-btn').forEach(btn => {
        if (btn.dataset.letter === activeLetter) btn.classList.remove('active');
      });
    }
  }

  // ── RESET — hapus active state ──
  function reset() {
    setActive(null);
  }

  return { update, setActive, reset };
}