// client/script.js
// State terpusat, fetch API, render grid, drawer detail, modal tambah/edit
// Phase 9: loadStats dioptimasi ke /api/stats (1 request), showError cleanup,
//          skeleton loading stat tiles, retry on error
// Upload poster: integrasi poster-upload.js

import { initSearchBar }          from './components/search-bar.js';
import { renderCard, getInitials } from './components/movie-card.js';
import { initAlphabetNav }        from './components/alphabet-nav.js';
import { initPosterUpload, openPosterUpload, resetPosterUpload } from './components/poster-upload.js';
import { supabase } from './supabase-client.js';
import { searchMoviesTMDB, getMovieDetailsTMDB } from './components/tmdb.js';
import { searchAnimeJikan, getAnimeDetailsJikan } from './components/jikan.js';

// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
const state = {
  search   : '',
  sort     : 'title_asc',
  approved : null,   // null = semua, 1 = approved, 0 = perlu review
  letter   : null,   // null = semua, 'A'–'Z' atau '#' = filter huruf
  films    : [],
  current  : null,   // film yang sedang dibuka di drawer
  editMode : false,  // true = edit, false = tambah baru
  isPublicView: false,
  publicUserId: null,
  publicUsername: null,
};

// ════════════════════════════════════════════
// ELEMENT REFS
// ════════════════════════════════════════════
const gridContainer  = document.getElementById('gridContainer');
const statsTotal     = document.getElementById('statsTotal');
const statsApproved  = document.getElementById('statsApproved');
const statsReview    = document.getElementById('statsReview');
const statsRating    = document.getElementById('statsRating');
const tabAll         = document.getElementById('tabAll');
const tabApproved    = document.getElementById('tabApproved');
const tabReview      = document.getElementById('tabReview');
const tabCounts      = {
  all      : document.getElementById('tabCountAll'),
  approved : document.getElementById('tabCountApproved'),
  review   : document.getElementById('tabCountReview'),
};
const drawerBg       = document.getElementById('drawerBg');
const addModal       = document.getElementById('addModal');
const sortBtns       = document.querySelectorAll('.sort-btn');
const sortDropMobile = document.getElementById('sortDropdownMobile');
const emptyState     = document.getElementById('emptyState');
const loadingState   = document.getElementById('loadingState');

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  
  // Check for public profile URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const publicUser = urlParams.get('user');
  
  if (publicUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', publicUser)
      .single();
      
    if (profile) {
      state.isPublicView = true;
      state.publicUserId = profile.id;
      state.publicUsername = profile.username;
      
      const titleEl = document.querySelector('.header-title');
      if (titleEl) titleEl.innerHTML = `FilmVault <span style="font-size: 14px; color: var(--ink-3); font-weight: normal;">punya ${profile.username}</span>`;
      
      document.getElementById('loginBtn').style.display = 'none';
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('openAddModal').style.display = 'none';
      document.getElementById('emptyState').style.display = 'none';
      
      initSort();
      initAlpha();
      initTabs();
      initDrawer();
      initKeyboard();
      initToastContainer();
      initRetryBtn();
      
      loadStats();
      loadMovies();
      return; // Skip initAuth
    }
  }

  initAuth();
  initSearch();
  initSort();
  initAlpha();
  initTabs();
  initDrawer();
  initModal();
  initPosterUpload({
    onUploaded: (newPath) => {
      if (state.current) state.current.cover_path = newPath;
    },
    onDeleted: () => {
      if (state.current) state.current.cover_path = null;
    },
  });
  initKeyboard();
  initToastContainer();
  initRetryBtn();
});

// ════════════════════════════════════════════
// SUPABASE AUTHENTICATION
// ════════════════════════════════════════════
async function initAuth() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const addBtn = document.getElementById('openAddModal');
  const grid = document.getElementById('gridContainer');
  const empty = document.getElementById('emptyState');

  loginBtn.addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  });

  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      // Logged in
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-flex';
      addBtn.style.display = 'inline-flex';
      empty.style.display = 'none';
      
      // Auto create profile if not exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error && error.code === 'PGRST116') {
        await supabase.from('profiles').insert([
          { id: session.user.id, username: session.user.email.split('@')[0] }
        ]);
      }
      
      loadMovies(); 
      loadStats();
    } else {
      // Logged out
      loginBtn.style.display = 'inline-flex';
      logoutBtn.style.display = 'none';
      addBtn.style.display = 'none';
      
      grid.innerHTML = '';
      empty.style.display = 'flex';
      empty.querySelector('.empty-title').innerText = 'Silakan Login Terlebih Dahulu';
      empty.querySelector('.empty-sub').innerText = 'Data film tersimpan di cloud';
      empty.querySelector('.btn')?.remove();
    }
  });
}

// ════════════════════════════════════════════
// THEME — dark / light mode, simpan ke localStorage
// ════════════════════════════════════════════
function initTheme() {
  const saved  = localStorage.getItem('filmvault-theme');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme  = saved || system;

  applyTheme(theme);

  document.getElementById('themeToggleBtn')
    ?.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('filmvault-theme', theme);
}

// ════════════════════════════════════════════
// RETRY BUTTON
// ════════════════════════════════════════════
function initRetryBtn() {
  const resetBtn = document.querySelector('#emptyState .btn-outline');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => window.resetFilter());
  }
}

// ════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════
let searchBarApi = null;

function initSearch() {
  searchBarApi = initSearchBar({
    inputId    : 'searchInput',
    clearId    : 'searchClear',
    debounceMs : 300,
    onSearch   : (keyword) => {
      state.search = keyword;
      loadMovies();
    },
  });
}

// ════════════════════════════════════════════
// SORT — buttons desktop + dropdown mobile, sinkron dua arah
// ════════════════════════════════════════════
function initSort() {
  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => setSort(btn.dataset.sort));
  });

  if (sortDropMobile) {
    sortDropMobile.addEventListener('change', () => setSort(sortDropMobile.value));
  }
}

function setSort(val) {
  state.sort = val;

  sortBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === val);
  });

  if (sortDropMobile) sortDropMobile.value = val;

  loadMovies();
}

// ════════════════════════════════════════════
// ALPHABET NAV
// ════════════════════════════════════════════
let alphabetNav = null;

function initAlpha() {
  alphabetNav = initAlphabetNav({
    containerId   : 'alphaNav',
    onLetterClick : (letter) => {
      state.letter = letter;
      loadMovies();
    },
  });
}

// ════════════════════════════════════════════
// TABS — Semua / Approved / Perlu Review
// ════════════════════════════════════════════
function initTabs() {
  tabAll?.addEventListener('click',      () => switchTab(null, tabAll));
  tabApproved?.addEventListener('click', () => switchTab(1,    tabApproved));
  tabReview?.addEventListener('click',   () => switchTab(0,    tabReview));
}

function switchTab(approvedVal, el) {
  state.approved = approvedVal;
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  el?.classList.add('active');
  loadMovies();
}

// ════════════════════════════════════════════
// FETCH MOVIES
// ════════════════════════════════════════════
async function loadMovies() {
  showLoading(true);

  try {
    let userId = null;
    
    if (state.isPublicView) {
      userId = state.publicUserId;
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');
      userId = user.id;
    }

    let query = supabase.from('movies').select('*').eq('user_id', userId);

    if (state.search) {
      query = query.ilike('title', `%${state.search}%`);
    }

    if (state.approved !== null) {
      query = query.eq('approved', state.approved);
    }

    if (state.letter) {
      if (state.letter === '#') {
        // Simple fallback for non-alphabet, could be complex in postgres, we'll do it post-fetch if needed
      } else {
        query = query.ilike('title', `${state.letter}%`);
      }
    }

    // Sort mapping
    if (state.sort) {
      const [col, order] = state.sort.split('_'); // e.g. title_asc, rating_desc
      if (col === 'title') {
        query = query.order('title', { ascending: order === 'asc' });
      } else if (col === 'year') {
        query = query.order('year', { ascending: order === 'asc' });
      } else if (col === 'rating') {
        query = query.order('rating', { ascending: order === 'asc' });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    state.films = data || [];
    
    // Post-fetch filter for '#' letter (non-alphabetical starting char)
    if (state.letter === '#') {
      state.films = state.films.filter(f => /^[^a-zA-Z]/.test(f.title));
    }

    renderGrid(state.films);
    alphabetNav?.update(state.films, state.films.length);
  } catch (err) {
    console.error('[loadMovies]', err);
    showError();
  } finally {
    showLoading(false);
  }
}

// ════════════════════════════════════════════
// FETCH STATS — 1 request /api/stats
// ════════════════════════════════════════════
async function loadStats() {
  showStatSkeleton(true);

  try {
    let userId = null;
    
    if (state.isPublicView) {
      userId = state.publicUserId;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
    }

    const { data: allMovies, error } = await supabase
      .from('movies')
      .select('approved, rating, title')
      .eq('user_id', userId);
      
    if (error) throw error;

    const total = allMovies.length;
    const approved = allMovies.filter(m => m.approved === 1 || m.approved === true).length;
    const review = total - approved;
    
    const validRatings = allMovies.filter(m => m.rating).map(m => Number(m.rating));
    const avgRating = validRatings.length ? (validRatings.reduce((a,b)=>a+b,0) / validRatings.length).toFixed(1) : '—';

    // Letters distribution
    const letters = {};
    allMovies.forEach(m => {
      const first = m.title?.[0]?.toUpperCase() || '#';
      const key = /[A-Z]/.test(first) ? first : '#';
      letters[key] = (letters[key] || 0) + 1;
    });

    if (statsTotal)    statsTotal.textContent    = total;
    if (statsApproved) statsApproved.textContent = approved;
    if (statsReview)   statsReview.textContent   = review;
    if (statsRating)   statsRating.textContent   = avgRating;

    if (tabCounts.all)      tabCounts.all.textContent      = total;
    if (tabCounts.approved) tabCounts.approved.textContent = approved;
    if (tabCounts.review)   tabCounts.review.textContent   = review;

    const subApproved = document.getElementById('statsApprovedSub');
    if (subApproved) {
      subApproved.textContent = total > 0 ? `${((approved / total) * 100).toFixed(1)}% dari total` : '0% dari total';
    }

    if (alphabetNav?.setLetterCounts) {
      alphabetNav.setLetterCounts(letters);
    }
  } catch (err) {
    console.error('[loadStats]', err);
    ['statsTotal', 'statsApproved', 'statsReview', 'statsRating'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.textContent === '') el.textContent = '—';
    });
  } finally {
    showStatSkeleton(false);
  }
}

// ════════════════════════════════════════════
// RENDER GRID — dikelompokkan per huruf (sort abjad) atau flat (sort lain)
// ════════════════════════════════════════════
function renderGrid(films) {
  if (!gridContainer) return;

  if (!films || films.length === 0) {
    gridContainer.innerHTML = '';
    showEmpty(true);
    return;
  }

  showEmpty(false);

  const isAlphaSort = state.sort === 'title_asc' || state.sort === 'title_desc';

  if (isAlphaSort) {
    const groups    = {};
    const keyOrder  = [];

    films.forEach(film => {
      const first = film.title?.[0]?.toUpperCase() || '#';
      const key   = /[A-Z]/.test(first) ? first : '#';
      if (!groups[key]) {
        groups[key] = [];
        keyOrder.push(key);
      }
      groups[key].push(film);
    });

    gridContainer.innerHTML = keyOrder.map(letter => `
      <div class="letter-section" id="section-${letter}">
        <div class="section-head">
          <div class="section-letter">${letter}</div>
          <div class="section-rule"></div>
          <div class="section-n">${groups[letter].length} film</div>
        </div>
        <div class="card-grid">
          ${groups[letter].map(film => renderCard(film)).join('')}
        </div>
      </div>
    `).join('');
  } else {
    gridContainer.innerHTML = `
      <div class="card-grid" style="margin-bottom: 8px;">
        ${films.map(film => renderCard(film)).join('')}
      </div>
    `;
  }

  // Animasi stagger
  const cards = gridContainer.querySelectorAll('.film-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${Math.min(i * 30, 400)}ms`;
    card.classList.add('card-enter');
  });

  attachCardEvents();
}

function attachCardEvents() {
  gridContainer.querySelectorAll('.film-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action-btn')) return;
      const id   = parseInt(card.dataset.id);
      const film = state.films.find(f => f.id === id);
      if (film) openDrawer(film);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  gridContainer.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id   = parseInt(btn.dataset.id);
      const film = state.films.find(f => f.id === id);
      if (film) openModal(film);
    });
  });

  gridContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id   = parseInt(btn.dataset.id);
      const film = state.films.find(f => f.id === id);
      if (film) deleteFilm(film);
    });
  });
}

// ════════════════════════════════════════════
// DRAWER — detail film
// ════════════════════════════════════════════
function initDrawer() {
  drawerBg?.addEventListener('click', (e) => {
    if (e.target === drawerBg) closeDrawer();
  });

  document.getElementById('drawerClose')
    ?.addEventListener('click', closeDrawer);

  document.getElementById('drawerEditBtn')
    ?.addEventListener('click', () => {
      if (state.current) openModal(state.current);
    });

  document.getElementById('approveToggleBtn')
    ?.addEventListener('click', toggleApprove);
}

function openDrawer(film) {
  state.current = film;
  const approved = film.approved === 1 || film.approved === true;

  const initEl = document.getElementById('drawerInit');
  if (initEl) initEl.textContent = getInitials(film.title);

  // Poster image
  const drawerPosterImg = document.getElementById('drawerPosterImg');
  if (drawerPosterImg) {
    if (film.cover_path) {
      drawerPosterImg.src           = film.cover_path;
      drawerPosterImg.style.display = 'block';
    } else {
      drawerPosterImg.style.display = 'none';
    }
  }

  setText('drawerTitle',    film.title || '—');
  setText('drawerLocal',    film.local_title && film.local_title !== film.title ? film.local_title : '');
  // Genre — tampilkan sebagai chips
  const genreEl = document.getElementById('drawerGenre');
  if (genreEl) {
    if (film.genre) {
      const genres = film.genre.split(',').map(g => g.trim()).filter(Boolean);
      genreEl.innerHTML = genres.map(g => `<span class="chip" style="font-size:11px">${g}</span>`).join('');
    } else {
      genreEl.textContent = '—';
    }
  }
  setText('drawerYear',     film.year     || '—');
  setText('drawerRating',   film.rating != null ? `★ ${parseFloat(film.rating).toFixed(1)}` : '—');
  setText('drawerSynopsis', film.synopsis || 'Tidak ada sinopsis.');
  setText('drawerDirector', film.director || '—');
  setText('drawerDuration', film.duration ? `${film.duration} menit` : '—');
  setText('drawerCountry',  film.country  || '—');

  // Studio — tampilkan sebagai chips jika lebih dari satu
  const studioEl = document.getElementById('drawerStudio');
  if (studioEl) {
    if (film.studio) {
      const studios = film.studio.split(',').map(s => s.trim()).filter(Boolean);
      studioEl.innerHTML = studios.length > 1
        ? studios.map(s => `<span class="chip" style="font-size:11px">${s}</span>`).join('')
        : studios[0];
    } else {
      studioEl.textContent = '—';
    }
  }

  const actorsEl = document.getElementById('drawerActors');
  if (actorsEl) {
    const actors = film.actor
      ? film.actor.split(',').map(a => a.trim()).filter(Boolean)
      : [];
    actorsEl.innerHTML = actors.length
      ? actors.map(a => `<span class="chip">${a}</span>`).join('')
      : '<span style="color:var(--ink-3);font-size:12px">—</span>';
  }

  const tagsEl = document.getElementById('drawerTags');
  if (tagsEl) {
    const tags = film.tag
      ? film.tag.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    tagsEl.innerHTML = tags.length
      ? tags.map(t => `<span class="chip">${t}</span>`).join('')
      : '<span style="color:var(--ink-3);font-size:12px">—</span>';
  }

  setText('drawerFilePath',  film.file_path        || '—');
  setText('drawerSubtitle',  film.subtitle_path     || '—');
  setText('drawerCoverPath', film.cover_path        || '—');
  setText('drawerBgPath',    film.background_path   || '—');

  updateDrawerStatus(approved);
  
  if (state.isPublicView) {
    const editBtn = document.getElementById('drawerEditBtn');
    const approveBtn = document.getElementById('approveToggleBtn');
    if (editBtn) editBtn.style.display = 'none';
    if (approveBtn) approveBtn.style.display = 'none';
  } else {
    const editBtn = document.getElementById('drawerEditBtn');
    const approveBtn = document.getElementById('approveToggleBtn');
    if (editBtn) editBtn.style.display = 'inline-flex';
    if (approveBtn) approveBtn.style.display = 'inline-flex';
  }

  drawerBg?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  drawerBg?.classList.remove('open');
  document.body.style.overflow = '';
  state.current = null;
}

function updateDrawerStatus(approved) {
  const statusEl = document.getElementById('drawerStatus');
  const btn      = document.getElementById('approveToggleBtn');

  if (!statusEl || !btn) return;

  if (approved) {
    statusEl.className = 'badge badge-green';
    statusEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px"><polyline points="20 6 9 17 4 12"/></svg> Approved`;
    btn.innerHTML  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Set Unapproved`;
    btn.className  = 'btn btn-outline';
  } else {
    statusEl.className = 'badge badge-red';
    statusEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Perlu Review`;
    btn.innerHTML  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg> Set Approved`;
    btn.className  = 'btn btn-primary';
  }
}

async function toggleApprove() {
  if (!state.current) return;
  const film      = state.current;
  const newStatus = (film.approved === 1 || film.approved === true) ? 0 : 1;

  try {
    const { error } = await supabase
      .from('movies')
      .update({ approved: newStatus })
      .eq('id', film.id);

    if (error) throw error;

    film.approved  = newStatus;
    state.current  = film;
    updateDrawerStatus(newStatus === 1);

    showToast(newStatus === 1 ? 'Film di-approved ✓' : 'Film di-unapprove', newStatus === 1 ? 'success' : '');
    await Promise.all([loadMovies(), loadStats()]);
  } catch (err) {
    console.error('[toggleApprove]', err);
    showToast('Gagal mengubah status: ' + err.message, 'error');
  }
}

// ════════════════════════════════════════════
// TAG INPUT — generic multi-value (genre & studio)
// ════════════════════════════════════════════
function initTagInput({ wrapperId, listId, inputId, hiddenId }) {
  const wrapper = document.getElementById(wrapperId);
  const tagList = document.getElementById(listId);
  const input   = document.getElementById(inputId);
  const hidden  = document.getElementById(hiddenId);
  if (!wrapper || !tagList || !input || !hidden) return;

  wrapper.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagList, hidden, input.value.trim());
      input.value = '';
    }
    if (e.key === 'Backspace' && input.value === '') {
      const tags = tagList.querySelectorAll('.multi-tag');
      if (tags.length > 0) tags[tags.length - 1].remove();
      syncHidden(tagList, hidden);
    }
  });

  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    pasted.split(',').forEach(v => addTag(tagList, hidden, v.trim()));
    input.value = '';
  });
}

function addTag(tagList, hidden, value) {
  if (!value) return;

  const existing = Array.from(tagList.querySelectorAll('.multi-tag'))
    .map(el => el.dataset.value?.toLowerCase());
  if (existing.includes(value.toLowerCase())) return;

  const tag = document.createElement('span');
  tag.className     = 'multi-tag';
  tag.dataset.value = value;
  tag.innerHTML     = `${value}<button type="button" class="multi-tag-remove" aria-label="Hapus ${value}">×</button>`;
  tag.querySelector('.multi-tag-remove').addEventListener('click', (e) => {
    e.stopPropagation();
    tag.remove();
    syncHidden(tagList, hidden);
  });

  tagList.appendChild(tag);
  syncHidden(tagList, hidden);
}

function syncHidden(tagList, hidden) {
  const values = Array.from(tagList.querySelectorAll('.multi-tag'))
    .map(el => el.dataset.value);
  hidden.value = values.join(', ');
}

function setTags(listId, hiddenId, csvString) {
  const tagList = document.getElementById(listId);
  const hidden  = document.getElementById(hiddenId);
  if (!tagList || !hidden) return;
  tagList.innerHTML = '';
  hidden.value = '';
  if (csvString) {
    csvString.split(',').forEach(v => addTag(tagList, hidden, v.trim()));
  }
}

// ════════════════════════════════════════════
// MODAL — tambah / edit film
// ════════════════════════════════════════════
function initModal() {
  addModal?.addEventListener('click', (e) => {
    if (e.target === addModal) closeModal();
  });

  document.getElementById('modalCloseBtn')
    ?.addEventListener('click', closeModal);

  document.getElementById('modalCancelBtn')
    ?.addEventListener('click', closeModal);

  document.getElementById('movieForm')
    ?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveFilm();
    });

  document.getElementById('modalSaveBtn')
    ?.addEventListener('click', (e) => {
      e.preventDefault();
      saveFilm();
    });

  ['field_title', 'field_year', 'field_rating'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => clearFieldError(id));
  });

  initTagInput({ wrapperId: 'genreTagWrapper',  listId: 'genreTagList',  inputId: 'field_genre_input',  hiddenId: 'field_genre'  });
  initTagInput({ wrapperId: 'studioTagWrapper', listId: 'studioTagList', inputId: 'field_studio_input', hiddenId: 'field_studio' });

  // API Search Handler
  const apiBtn = document.getElementById('apiSearchBtn');
  const apiInput = document.getElementById('apiSearchInput');
  const apiResults = document.getElementById('apiSearchResults');

  if (apiBtn && apiInput && apiResults) {
    apiBtn.addEventListener('click', async () => {
      const query = apiInput.value.trim();
      if (!query) return;
      
      const type = document.querySelector('input[name="search_type"]:checked').value;
      apiBtn.textContent = 'Mencari...';
      
      let results = [];
      if (type === 'movie') {
        results = await searchMoviesTMDB(query);
      } else {
        results = await searchAnimeJikan(query);
      }
      
      apiBtn.textContent = 'Cari';
      
      if (results.length === 0) {
        apiResults.innerHTML = '<div style="color:var(--ink-3);font-size:14px;">Tidak ditemukan.</div>';
        return;
      }
      
      apiResults.innerHTML = results.slice(0, 5).map(m => {
        const id = m.id || m.mal_id;
        const title = m.title;
        const year = (m.release_date || '').substring(0,4) || (m.aired?.from || '').substring(0,4) || 'N/A';
        const poster = m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : (m.images?.jpg?.image_url || '');
        return `
          <div class="api-result-item" style="display:flex; align-items:center; gap:12px; padding:8px; border:1px solid var(--surface-3); border-radius:8px; cursor:pointer;" data-id="${id}" data-type="${type}">
            <img src="${poster}" alt="" style="width:40px; height:60px; object-fit:cover; border-radius:4px; background:var(--surface-3);">
            <div>
              <div style="font-weight:600; color:var(--ink-1);">${title}</div>
              <div style="font-size:12px; color:var(--ink-3);">${year}</div>
            </div>
          </div>
        `;
      }).join('');

      // Attach click to auto-fill
      apiResults.querySelectorAll('.api-result-item').forEach(item => {
        item.addEventListener('click', async () => {
          const id = item.dataset.id;
          const rType = item.dataset.type;
          apiResults.innerHTML = '<div style="color:var(--ink-3);font-size:14px;">Menarik data lengkap...</div>';
          
          let details = null;
          if (rType === 'movie') {
            details = await getMovieDetailsTMDB(id);
            if (details) {
              document.getElementById('field_title').value = details.original_title || details.title;
              document.getElementById('field_local_title').value = details.title;
              document.getElementById('field_year').value = details.release_date?.substring(0,4) || '';
              document.getElementById('field_synopsis').value = details.overview || '';
              document.getElementById('field_duration').value = details.runtime || '';
              document.getElementById('field_rating').value = details.vote_average ? details.vote_average.toFixed(1) : '';
              
              if (details.poster_path) {
                document.getElementById('field_cover_path').value = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
              }
              if (details.backdrop_path) {
                document.getElementById('field_background_path').value = `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`;
              }
              
              const genres = details.genres?.map(g => g.name).join(', ') || '';
              setTags('genreTagList', 'field_genre', genres);
              
              const studios = details.production_companies?.map(c => c.name).join(', ') || '';
              setTags('studioTagList', 'field_studio', studios);
            }
          } else {
            details = await getAnimeDetailsJikan(id);
            if (details) {
              document.getElementById('field_title').value = details.title_japanese || details.title;
              document.getElementById('field_local_title').value = details.title;
              document.getElementById('field_year').value = details.year || (details.aired?.from || '').substring(0,4) || '';
              document.getElementById('field_synopsis').value = details.synopsis || '';
              document.getElementById('field_duration').value = details.episodes ? `${details.episodes} ep` : '';
              document.getElementById('field_rating').value = details.score || '';
              
              if (details.images?.jpg?.large_image_url) {
                document.getElementById('field_cover_path').value = details.images.jpg.large_image_url;
              }
              
              const genres = details.genres?.map(g => g.name).join(', ') || '';
              setTags('genreTagList', 'field_genre', genres);
              
              const studios = details.studios?.map(c => c.name).join(', ') || '';
              setTags('studioTagList', 'field_studio', studios);
            }
          }
          
          apiResults.innerHTML = '';
          apiInput.value = '';
        });
      });
    });
  }
}

function openModal(film = null) {
  state.editMode = !!film;

  const titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.textContent = film ? 'Edit Metadata' : 'Tambah Film Baru';

  const fields = [
    'title', 'local_title', 'year', 'genre', 'synopsis', 'director',
    'actor', 'rating', 'duration', 'country', 'studio', 'tag',
    'file_path', 'cover_path', 'background_path', 'subtitle_path',
  ];

  fields.forEach(key => {
    if (key === 'genre' || key === 'studio') return; // dihandle lewat tag input
    const el = document.getElementById(`field_${key}`);
    if (el) el.value = film?.[key] ?? '';
  });

  // Populate tag inputs
  setTags('genreTagList',  'field_genre',  film?.genre  ?? '');
  setTags('studioTagList', 'field_studio', film?.studio ?? '');

  const approvedEl = document.getElementById('field_approved');
  if (approvedEl) {
    approvedEl.value = (film?.approved === 1 || film?.approved === true) ? '1' : '0';
  }

  const idEl = document.getElementById('field_id');
  if (idEl) idEl.value = film?.id ?? '';

  clearAllErrors();

  // Buka komponen poster upload — tampil hanya jika mode edit (film sudah ada ID)
  openPosterUpload(
    film?.id ?? null,
    film?.cover_path ?? null,
  );

  addModal?.classList.add('open');
  document.body.style.overflow = 'hidden';

  setTimeout(() => document.getElementById('field_title')?.focus(), 100);
}

function closeModal() {
  addModal?.classList.remove('open');
  document.body.style.overflow = '';
  clearAllErrors();
  resetPosterUpload();
}

// ── Validasi client-side ──
function validateForm() {
  let valid = true;

  const title = document.getElementById('field_title')?.value?.trim();
  if (!title) {
    setFieldError('field_title', 'err-title', 'Judul asli wajib diisi.');
    valid = false;
  }

  const year = document.getElementById('field_year')?.value;
  if (year !== '' && year !== undefined && year !== null) {
    const y = Number(year);
    if (isNaN(y) || !Number.isInteger(y) || y < 1888 || y > 2100) {
      setFieldError('field_year', 'err-year', 'Tahun harus antara 1888–2100.');
      valid = false;
    }
  }

  const rating = document.getElementById('field_rating')?.value;
  if (rating !== '' && rating !== undefined && rating !== null) {
    const r = Number(rating);
    if (isNaN(r) || r < 0 || r > 10) {
      setFieldError('field_rating', 'err-rating', 'Rating harus antara 0–10.');
      valid = false;
    }
  }

  return valid;
}

function setFieldError(fieldId, errId, message) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add('invalid');
  if (err)   err.textContent = message;
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  field?.classList.remove('invalid');

  const name  = fieldId.replace('field_', '');
  const errEl = document.getElementById(`err-${name}`);
  if (errEl) errEl.textContent = '';

  const banner = document.getElementById('formErrorBanner');
  if (banner) banner.style.display = 'none';
}

function clearAllErrors() {
  document.querySelectorAll('.field-input.invalid, .field-textarea.invalid, .field-select.invalid')
    .forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.error-msg')
    .forEach(el => el.textContent = '');

  const banner = document.getElementById('formErrorBanner');
  if (banner) banner.style.display = 'none';
}

function showFormError(messages) {
  const banner = document.getElementById('formErrorBanner');
  if (!banner) return;

  if (Array.isArray(messages) && messages.length > 1) {
    banner.innerHTML = `<strong>Perbaiki kesalahan berikut:</strong><ul>${messages.map(m => `<li>${m}</li>`).join('')}</ul>`;
  } else {
    banner.textContent = Array.isArray(messages) ? messages[0] : messages;
  }

  banner.style.display = 'block';
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function saveFilm() {
  if (!validateForm()) return;

  const id     = document.getElementById('field_id')?.value;
  const fields = [
    'title', 'local_title', 'year', 'genre', 'synopsis', 'director',
    'actor', 'rating', 'duration', 'country', 'studio', 'tag',
    'file_path', 'cover_path', 'background_path', 'subtitle_path',
  ];

  const data = {};
  fields.forEach(key => {
    const el = document.getElementById(`field_${key}`);
    if (el) data[key] = el.value.trim() || null;
  });
  data.approved = document.getElementById('field_approved')?.value === '1' ? 1 : 0;

  const saveBtn = document.getElementById('modalSaveBtn');
  if (saveBtn) {
    saveBtn.disabled  = true;
    saveBtn.innerHTML = 'Menyimpan…';
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    data.user_id = user.id;

    if (state.editMode && id) {
      const { error } = await supabase
        .from('movies')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('movies')
        .insert([data]);
      if (error) throw error;
    }

    closeModal();
    closeDrawer();

    const namaFilm = data.title || 'Film';
    showToast(
      state.editMode
        ? `"${namaFilm}" berhasil diperbarui ✓`
        : `"${namaFilm}" berhasil ditambahkan ✓`,
      'success'
    );

    await Promise.all([loadMovies(), loadStats()]);
  } catch (err) {
    console.error('[saveFilm]', err);
    showFormError('Gagal menyimpan: ' + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled  = false;
      saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg> Simpan Film`;
    }
  }
}

// ════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════
async function deleteFilm(film) {
  const konfirmasi = confirm(`Hapus film "${film.title}"?\nData akan dihapus permanen.`);
  if (!konfirmasi) return;

  try {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', film.id);

    if (error) throw error;

    if (state.current?.id === film.id) closeDrawer();

    showToast(`"${film.title}" berhasil dihapus`, '');
    await Promise.all([loadMovies(), loadStats()]);
  } catch (err) {
    console.error('[deleteFilm]', err);
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
}

// ════════════════════════════════════════════
// KEYBOARD GLOBAL
// ════════════════════════════════════════════
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (addModal?.classList.contains('open')) return closeModal();
      if (drawerBg?.classList.contains('open'))  return closeDrawer();
    }
  });
}

// ════════════════════════════════════════════
// TOAST NOTIFICATION
// ════════════════════════════════════════════
let toastContainer = null;

function initToastContainer() {
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}

function showToast(message, type = '') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast${type ? ` toast-${type}` : ''}`;

  const icon = type === 'success'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : type === 'error'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  toast.innerHTML = `${icon}<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}

// Ekspor toast ke global scope agar bisa diakses poster-upload.js
window.showToastGlobal = showToast;

// ════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showLoading(on) {
  if (loadingState)  loadingState.style.display   = on ? 'flex' : 'none';
  if (gridContainer) gridContainer.style.opacity  = on ? '0.4'  : '1';
}

function showEmpty(on) {
  if (emptyState) emptyState.style.display = on ? 'flex' : 'none';
}

function showStatSkeleton(on) {
  ['statsTotal', 'statsApproved', 'statsReview', 'statsRating'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (on) {
      el.classList.add('stat-skeleton');
      el.textContent = '';
    } else {
      el.classList.remove('stat-skeleton');
    }
  });
}

function showError() {
  if (!gridContainer) return;

  gridContainer.innerHTML = `
    <div class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div class="error-state-msg">Gagal memuat data. Pastikan server berjalan.</div>
      <button class="btn btn-outline error-retry-btn">Coba Lagi</button>
    </div>
  `;

  gridContainer.querySelector('.error-retry-btn')
    ?.addEventListener('click', () => window.resetFilter());
}

// ════════════════════════════════════════════
// GLOBAL EXPORTS
// ════════════════════════════════════════════
window.resetFilter = function () {
  state.search   = '';
  state.sort     = 'title_asc';
  state.approved = null;
  state.letter   = null;

  searchBarApi?.setValue('');
  setSort('title_asc');
  alphabetNav?.reset();
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  tabAll?.classList.add('active');

  loadMovies();
};

window.openModal = openModal;