# PULSE Local Intelligence

PULSE is a real-time, location-aware app for understanding nearby reports while clearly separating early signals, corroborated information, confirmed events, disputed claims, and expired information.

## Setup and Usage

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, enter your name, and allow browser location access. Use the bottom navigation to view the feed, map, report form, alerts, and profile; desktop users also get the sidebar, Ask Pulse, and Demo mode.

Copy `.env.example` to `.env` and configure `MONGODB_URI`, `MONGODB_DB`, `GEMINI_API_KEY`, and `GEMINI_MODEL`. The browser talks to the Express API; Gemini is called server-side so the API key is never bundled into the frontend.

## Maps

Google Maps is optional. PULSE uses Leaflet with OpenStreetMap tiles, which is sufficient for event markers and does not require a Google API key.
