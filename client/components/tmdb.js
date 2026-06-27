const TMDB_API_KEY = '918bb68b82d24955fb0862a54a8cada7';
const BASE_URL = 'https://api.themoviedb.org/3';

export async function searchMoviesTMDB(query) {
  if (!query) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=id-ID`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB Search Error:', error);
    return [];
  }
}

export async function getMovieDetailsTMDB(tmdbId) {
  try {
    const res = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=id-ID&append_to_response=credits`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('TMDB Details Error:', error);
    return null;
  }
}
