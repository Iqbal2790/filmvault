// client/components/anidb.js

// Fungsi utilitas untuk memberikan jeda waktu (delay)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ANIDB_CONFIG = {
  baseUrl: 'http://api.anidb.net:9001/httpapi',
  clientName: 'testclient123', // TODO: Ganti dengan nama client yang sudah Anda daftarkan jika untuk produksi
  clientVer: '1',
  protoVer: '1'
};

// Variabel global (di level file) untuk mencatat waktu request terakhir.
// AniDB sangat ketat soal rate limit (maks 1 request per 2-4 detik)
let lastRequestTime = 0;

async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minimumDelay = 3000; // 3 detik

  if (timeSinceLastRequest < minimumDelay) {
    const timeToWait = minimumDelay - timeSinceLastRequest;
    console.log(`[AniDB] Menunggu ${timeToWait}ms agar tidak di-banned...`);
    await delay(timeToWait);
  }
  
  lastRequestTime = Date.now(); // Catat waktu setelah delay selesai
}

/**
 * Mengambil detail anime dari AniDB berdasarkan ID
 * @param {string|number} anidbId - ID Anime di AniDB
 */
export async function getAnimeDetailsAnidb(anidbId) {
  if (!anidbId) return null;

  try {
    // 1. Terapkan jeda waktu agar aman
    await enforceRateLimit();

    const url = `${ANIDB_CONFIG.baseUrl}?request=anime&client=${ANIDB_CONFIG.clientName}&clientver=${ANIDB_CONFIG.clientVer}&protover=${ANIDB_CONFIG.protoVer}&aid=${anidbId}`;
    
    // 2. Fetch data
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    // 3. AniDB mengembalikan teks XML
    const xmlText = await res.text();
    
    // 4. Ubah string XML menjadi dokumen yang bisa di-query (DOM)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Periksa apakah terjadi error dari parser
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
       console.error("Error parsing XML dari AniDB:", parseError[0].textContent);
       return null;
    }

    // Periksa apakah AniDB mengembalikan pesan error (misal: "BANNED" atau "NO SUCH ANIME")
    const errorNode = xmlDoc.getElementsByTagName('error')[0];
    if (errorNode) {
        console.error("Error dari server AniDB:", errorNode.textContent);
        return null;
    }

    // 5. Ekstrak data yang diperlukan
    // Mengambil judul utama
    const titles = xmlDoc.getElementsByTagName('title');
    let mainTitle = '';
    
    for (let i = 0; i < titles.length; i++) {
      if (titles[i].getAttribute('type') === 'main') {
        mainTitle = titles[i].textContent;
        break;
      }
    }
    
    if (!mainTitle && titles.length > 0) {
        mainTitle = titles[0].textContent; // Fallback jika tidak ada type="main"
    }

    // Mengambil deskripsi (sinopsis)
    const descriptionNode = xmlDoc.getElementsByTagName('description')[0];
    const description = descriptionNode ? descriptionNode.textContent : '';

    // Kembalikan sebagai object JavaScript biasa
    return {
      anidbId: anidbId,
      title: mainTitle,
      description: description,
      xmlData: xmlText // Menyimpan XML mentah jika Anda butuh tag lain nanti
    };

  } catch (error) {
    console.error('AniDB Details Error:', error);
    return null;
  }
}
