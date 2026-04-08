# Wall Calendar App

A print-inspired wall calendar built with React, Vite, Tailwind CSS, and date-fns.

## Why this structure

- React + Vite: fast development workflow and simple production build.
- Tailwind CSS: fast visual iteration for a custom calendar UI.
- date-fns: reliable date calculations for month rendering and range selection.
- Component split for maintainability:
  - `src/components/HeroSection.jsx`
  - `src/components/CalendarGrid.jsx`
  - `src/components/NotesPanel.jsx`
  - shared helpers in `src/utils/calendarUtils.js`

## Features

- Month navigation and year switcher.
- Accurate monthly grid (Mon-Sun layout).
- Date range selection with preview.
- Three-step interaction for same-day selection:
  1. first click selects start date
  2. second click on same date creates single-day selection
  3. third click clears that single-day selection
- Notes saved per day or per date range.
- Persistent notes in local storage.
- Toast feedback on save/delete actions.
- Visual indicators for days with saved notes.
- Dynamic hero image fetched from Unsplash by month keyword.

## Environment

Create a local `.env` file in the project root:

VITE_UNSPLASH_KEY=YOUR_ACCESS_KEY

Only the Unsplash Access Key is used on the client. Do not expose any secret key.

## Run locally

1. Install dependencies

   npm install

2. Start development server

   npm run dev

3. Build for production

   npm run build

4. Preview production build

   npm run preview

## Notes

- If the hero image does not load, verify your `.env` key and restart the dev server.
- The app icon is configured in `index.html`.
