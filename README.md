# PULSE

PULSE gives you a real-time, location-based view of what’s happening around you, separating early reports from verified information.
Instead of showing you a generic feed of national news, PULSE focuses on what matters where you are right now.
As you move from one location to another, the information you see changes with you. A user in Abuja might see reports about an accident, road closure, security incident, flood, protest, power outage, or other developing event nearby. If they travel toward Kaduna, PULSE progressively shifts the feed toward relevant reports along their new location and route..

## Setup and Usage

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, enter your name, and allow browser location access. Use the bottom navigation to view the feed, map, report form, alerts, and profile; desktop users also get the sidebar and Ask Pulse.

Copy `.env.example` to `.env` and configure `MONGODB_URI`, `MONGODB_DB`, `GEMINI_API_KEY`, and `GEMINI_MODEL`. The browser talks to the Express API; Gemini is called server-side so the API key is never bundled into the frontend.

## Maps

Google Maps is optional. PULSE uses Leaflet with OpenStreetMap tiles, which is sufficient for event markers and does not require a Google API key.
