# Spotify Dashboard

A Next.js Spotify dashboard with catalog search, playlist cleanup, and listening reports.

## Features

- Spotify OAuth connection flow
- Spotify catalog search for songs, artists, albums, and podcasts
- Spotify player view for the current track
- Playlist organizer for duplicate, unavailable, and bulk cleanup workflows
- Overview dashboard with listening summaries
- Period-based reports (`daily`, `weekly`, `monthly`, `yearly`)
- Library views for top artists and albums
- Discover page with personalized recommendations
- Profile view for connected Spotify account
- Real-time now playing updates on the dashboard page
- Fallback sample data when Spotify is unavailable

## Pages

- `/` — Spotify catalog search
- `/organizer` — Playlist organizer
- `/dashboard` — Spotify player
- `/reports/[period]` — Period report pages
- `/library/[category]/[period]` — Library pages (`artists` or `albums`)
- `/discover` — Personalized recommendation page
- `/profile` — Connected account profile
- `/connect` — Spotify connection page

## API Routes

- `/api/auth/spotify` — Start Spotify OAuth
- `/api/auth/callback/spotify` — OAuth callback handler
- `/api/auth/logout` — Clear Spotify session
- `/api/search` — Spotify catalog search endpoint
- `/api/organizer/playlists` — Editable playlist list endpoint
- `/api/organizer/playlists/[playlistId]` — Playlist detail and cleanup endpoint
- `/api/dashboard` — Dashboard data endpoint
- `/api/now-playing` — Lightweight real-time now playing endpoint
- `/api/discovery` — Discovery recommendations endpoint
- `/api/health` — Health check endpoint

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Vitest
- ESLint

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and configure values:
   ```bash
   cp .env.example .env.local
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Environment Variables

Defined in `.env.example`:

- `APP_URL`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_SESSION_SECRET`
- `SPOTIFY_SCOPES`

## Scripts

- `npm run dev` — Start dev server
- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest tests
- `npm run build` — Build production app
- `npm run start` — Start production server
