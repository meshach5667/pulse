# PULSE Local Intelligence

PULSE is a real-time, location-aware app for understanding nearby reports while clearly separating early signals, corroborated information, confirmed events, disputed claims, and expired information.

## Setup and Usage

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, enter your name, and allow browser location access. Use the bottom navigation to view the feed, map, report form, alerts, and profile; desktop users also get the sidebar, Ask Pulse, and Demo mode.

Copy `.env.example` to `.env` and configure the Supabase variables for live data. `VITE_AI_API_URL` is optional; without it, the app uses a grounded local fallback for Ask Pulse and report analysis.

## Maps

Google Maps is not required. PULSE uses Leaflet with OpenStreetMap tiles, which is sufficient for event markers and does not require a Google API key. Add Google Maps only if the product later needs Google-specific places, traffic, directions, or geocoding services.
