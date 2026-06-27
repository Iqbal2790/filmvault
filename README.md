# FilmVault 🎬

FilmVault is a modern, serverless web application designed to help users track, review, and manage their personal movie and anime collections. Built with a sleek, responsive UI, it provides a seamless experience across all devices.

## ✨ Features

- **Authentication**: Secure Google OAuth login powered by Supabase.
- **Auto-Fill Metadata**: Integrated with the **TMDB API** (for movies) and **Jikan API** (for anime) to automatically pull posters, titles, release years, synopsis, and genres with a single click.
- **Serverless Architecture**: 100% frontend-driven. Data is stored directly in Supabase (PostgreSQL), eliminating the need for a custom backend server.
- **Real-time CRUD**: Add, edit, and delete movies with instantaneous UI updates.
- **Smart Filtering & Sorting**: Filter your library alphabetically or search by title. Sort by title, year, or rating.
- **Rich Dashboard**: View statistics such as total films watched, average rating, and approval status at a glance.
- **Dark/Light Mode**: Automatic theme detection with a manual toggle switch for eye comfort.

## 🚀 Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Custom Properties / CSS Variables)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Google OAuth)
- **APIs**:
  - The Movie Database (TMDB) API v3
  - Jikan API (Unofficial MyAnimeList API)

## 📦 Deployment (Vercel)

Since FilmVault is a purely frontend static application, it can be easily deployed to Vercel in seconds:

1. Push this repository to your GitHub account.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Ensure the output directory is set correctly (or leave it default if Vercel detects it).
5. Click **Deploy**.

## 🛠️ Local Development

To run this project locally:

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the local dev server: `npm run dev`
4. Open the provided `localhost` URL in your browser.

> **Note**: Ensure you have set up your own Supabase project and TMDB API keys in `client/supabase-client.js` and `client/components/tmdb.js` respectively.
