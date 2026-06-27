const BASE_URL = 'https://api.jikan.moe/v4';

export async function searchAnimeJikan(query) {
  if (!query) return [];
  try {
    const res = await fetch(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=5`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Jikan Search Error:', error);
    return [];
  }
}

export async function getAnimeDetailsJikan(malId) {
  try {
    const res = await fetch(`${BASE_URL}/anime/${malId}/full`);
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Jikan Details Error:', error);
    return null;
  }
}
