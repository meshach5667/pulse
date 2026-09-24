export interface City {
  name: string;
  latitude: number;
  longitude: number;
  region: string;
}

/** Regions Pulse groups the feed by. GPS positions snap to the nearest one. */
export const CITIES: City[] = [
  { name: "Abuja", latitude: 9.0579, longitude: 7.4951, region: "FCT" },
  { name: "Kaduna", latitude: 10.5222, longitude: 7.4383, region: "Kaduna State" },
  { name: "Kano", latitude: 12.0022, longitude: 8.5919, region: "Kano State" },
  { name: "Lagos", latitude: 6.5244, longitude: 3.3792, region: "Lagos State" },
  { name: "Ibadan", latitude: 7.3775, longitude: 3.947, region: "Oyo State" },
  { name: "Port Harcourt", latitude: 4.8156, longitude: 7.0498, region: "Rivers State" },
  { name: "Benin City", latitude: 6.335, longitude: 5.6037, region: "Edo State" },
  { name: "Enugu", latitude: 6.4584, longitude: 7.5464, region: "Enugu State" },
  { name: "Jos", latitude: 9.8965, longitude: 8.8583, region: "Plateau State" },
  { name: "Ilorin", latitude: 8.4966, longitude: 4.5421, region: "Kwara State" },
  { name: "Abeokuta", latitude: 7.1475, longitude: 3.3619, region: "Ogun State" },
  { name: "Maiduguri", latitude: 11.8311, longitude: 13.151, region: "Borno State" },
];

/** Cities used by the Simulate Travel demo. */
export const TRAVEL_ROUTE = ["Abuja", "Kaduna", "Kano", "Lagos", "Ibadan"];

const FALLBACK: City = CITIES[0] as City;

export function cityByName(name: string): City {
  return CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? FALLBACK;
}

export function nearestCity(latitude: number, longitude: number): City {
  let best = FALLBACK;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of CITIES) {
    const d = (city.latitude - latitude) ** 2 + (city.longitude - longitude) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = city;
    }
  }
  return best;
}

export interface ResolvedPlace {
  city: string;
  area: string | null;
}

/**
 * Turns device coordinates into a region (Abuja, Ibadan, Lagos...) plus a
 * neighbourhood when reverse geocoding is available.
 */
export async function resolvePlace(latitude: number, longitude: number): Promise<ResolvedPlace> {
  const nearest = nearestCity(latitude, longitude);
  let area: string | null = null;
  let geocodedCity: string | null = null;
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (response.ok) {
      const data = (await response.json()) as { city?: string; locality?: string };
      area = data.locality || null;
      geocodedCity = data.city || null;
    }
  } catch {
    /* fall back to nearest known region */
  }

  // Prefer a known region if the geocoded city matches one, otherwise nearest region.
  const known = geocodedCity
    ? CITIES.find((c) => geocodedCity!.toLowerCase().includes(c.name.toLowerCase()))
    : undefined;
  const km = Math.sqrt(
    (nearest.latitude - latitude) ** 2 + (nearest.longitude - longitude) ** 2,
  ) * 111;
  const city = known?.name ?? (km < 120 || !geocodedCity ? nearest.name : geocodedCity);
  return { city, area: area && area !== city ? area : null };
}
