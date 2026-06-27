// client/components/movie-card.js
// Komponen card satu film — render HTML string

export function getInitials(title) {
  if (!title) return '??';
  return title
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase();
}

export function renderCard(film, { onEdit, onDelete } = {}) {
  const initials  = getInitials(film.title);
  const rating    = film.rating != null ? parseFloat(film.rating).toFixed(1) : null;
  const localDiff = film.local_title && film.local_title !== film.title;

  let dotClass = 'dot-unapproved';
  let statusText = 'Plan to Watch';
  if (film.status === 'Watched') {
    dotClass = 'dot-approved';
    statusText = 'Watched';
  } else if (film.status === 'Dropped') {
    dotClass = 'dot-dropped';
    statusText = 'Dropped';
  }

  // Poster: pakai gambar jika cover_path tersedia
  const posterInner = film.cover_path
    ? `<img src="${film.cover_path}" alt="${film.title}" loading="lazy"
            style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;"
            onerror="this.style.display='none'">`
    : '';

  return `
    <div class="film-card" data-id="${film.id}" tabindex="0" role="button"
         aria-label="${film.title}">
      <div class="card-poster">
        <div class="poster-lines"></div>
        <div class="poster-initials">${initials}</div>
        ${posterInner}

        <div class="card-status-dot ${dotClass}"
             title="${statusText}"></div>

        ${rating !== null ? `<div class="card-rating-badge">★ ${rating}</div>` : ''}

        ${new URLSearchParams(window.location.search).has('user') ? '' : `
        <div class="card-actions">
          <button class="card-action-btn btn-edit" data-id="${film.id}" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="card-action-btn btn-delete" data-id="${film.id}" title="Hapus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
        `}
      </div>

      <div class="card-body">
        <div class="card-title">${film.title}</div>
        <div class="card-local" style="${localDiff ? '' : 'visibility:hidden'}">
          ${localDiff ? film.local_title : '—'}
        </div>
        <div class="card-meta">
          ${film.year ? `<span class="card-year">${film.year}</span>` : ''}
          ${film.genre ? `<span class="card-genre">${film.genre.split(',')[0].trim()}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}