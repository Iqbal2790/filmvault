// client/components/search-bar.js
// Komponen search bar terpisah — debounce, clear button, keyboard shortcut

export function initSearchBar({ inputId, clearId, onSearch, debounceMs = 300 }) {
  const input   = document.getElementById(inputId);
  const clearBtn = document.getElementById(clearId);

  if (!input) {
    console.warn(`[SearchBar] Element #${inputId} tidak ditemukan.`);
    return null;
  }

  let timer = null;

  // ── INPUT HANDLER ──
  input.addEventListener('input', () => {
    const val = input.value.trim();

    // Tampilkan / sembunyikan clear button
    if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';

    clearTimeout(timer);
    timer = setTimeout(() => {
      onSearch(val);
    }, debounceMs);
  });

  // ── CLEAR BUTTON ──
  if (clearBtn) {
    clearBtn.style.display = 'none';
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      clearTimeout(timer);
      onSearch('');
      input.focus();
    });
  }

  // ── KEYBOARD SHORTCUT ──
  // Escape: bersihkan search
  // Ctrl+F / Cmd+F tidak dicegah (biar browser tetap bisa dipakai)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (input.value) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        clearTimeout(timer);
        onSearch('');
      }
    }
  });

  // Fokus ke search saat tekan '/' di luar input
  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      document.activeElement !== input &&
      document.activeElement.tagName !== 'INPUT' &&
      document.activeElement.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  // ── API PUBLIK ──
  // Gunakan untuk sinkronisasi nilai dari luar (misal reset filter)
  function setValue(val) {
    input.value = val || '';
    if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
  }

  function getValue() {
    return input.value.trim();
  }

  function focus() {
    input.focus();
  }

  return { setValue, getValue, focus };
}