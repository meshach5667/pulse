export interface City {
  name: string;
  latitude: number;
  longitude: number;
  region: string;
}

export const CITIES: City[] = [
  { name: "Abuja", latitude: 9.0579, longitude: 7.4951, region: "FCT" },
  { name: "Kaduna", latitude: 10.5222, longitude: 7.4383, region: "Kaduna State" },
  { name: "Kano", latitude: 12.0022, longitude: 8.5919, region: "Kano State" },
  { name: "Lagos", latitude: 6.5244, longitude: 3.3792, region: "Lagos State" },
];

export function cityByName(name: string): City {
  return CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? CITIES[0];
}

export function nearestCity(latitude: number, longitude: number): City {
  let best = CITIES[0];
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

export async function resolvePlace(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (response.ok) {
      const data = (await response.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
      };
      return (
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        nearestCity(latitude, longitude).name
      );
    }
  } catch {
    // Use the nearest known city when reverse geocoding is unavailable.
  }
  return nearestCity(latitude, longitude).name;
}
