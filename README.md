# Pulse Local Intelligence

PULSE is a real-time, location-aware intelligence app that helps people understand what is happening nearby while clearly separating early signals, corroborated reports, confirmed events, disputed claims, and expired information. It combines live local reports, transparent evidence, AI-assisted analysis, and a GPS-based feed without presenting uncertainty as fact.

## Setup and Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `MONGODB_DB`, and `GEMINI_API_KEY`.

3. Start the Vite frontend and Express API:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173` and allow location access when prompted.
