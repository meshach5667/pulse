import { distanceKm } from "./geo";

export interface City {
  name: string;
  latitude: number;
  longitude: number;
  region: string;
}

/** Comprehensive list of Nigerian state capitals and major metropolitan areas */
export const CITIES: City[] = [
  // FCT
  { name: "Abuja", latitude: 9.0579, longitude: 7.4951, region: "FCT" },
  { name: "Gwagwalada", latitude: 8.9806, longitude: 7.1772, region: "FCT" },
  // Lagos
  { name: "Lagos", latitude: 6.5244, longitude: 3.3792, region: "Lagos State" },
  { name: "Ikeja", latitude: 6.6018, longitude: 3.3515, region: "Lagos State" },
  { name: "Lekki", latitude: 6.4698, longitude: 3.5852, region: "Lagos State" },
  { name: "Ikorodu", latitude: 6.6194, longitude: 3.5105, region: "Lagos State" },
  { name: "Epe", latitude: 6.5841, longitude: 3.9834, region: "Lagos State" },
  { name: "Badagry", latitude: 6.4316, longitude: 2.8876, region: "Lagos State" },
  // Oyo
  { name: "Ibadan", latitude: 7.3775, longitude: 3.947, region: "Oyo State" },
  { name: "Ogbomoso", latitude: 8.1333, longitude: 4.25, region: "Oyo State" },
  { name: "Oyo", latitude: 7.8431, longitude: 3.9368, region: "Oyo State" },
  // Rivers
  { name: "Port Harcourt", latitude: 4.8156, longitude: 7.0498, region: "Rivers State" },
  // Kano
  { name: "Kano", latitude: 12.0022, longitude: 8.5919, region: "Kano State" },
  // Kaduna
  { name: "Kaduna", latitude: 10.5222, longitude: 7.4383, region: "Kaduna State" },
  { name: "Zaria", latitude: 11.0855, longitude: 7.7199, region: "Kaduna State" },
  // Edo
  { name: "Benin City", latitude: 6.335, longitude: 5.6037, region: "Edo State" },
  { name: "Auchi", latitude: 7.0667, longitude: 6.2667, region: "Edo State" },
  // Enugu
  { name: "Enugu", latitude: 6.4584, longitude: 7.5464, region: "Enugu State" },
  { name: "Nsukka", latitude: 6.8561, longitude: 7.3958, region: "Enugu State" },
  // Plateau
  { name: "Jos", latitude: 9.8965, longitude: 8.8583, region: "Plateau State" },
  // Kwara
  { name: "Ilorin", latitude: 8.4966, longitude: 4.5421, region: "Kwara State" },
  { name: "Offa", latitude: 8.1491, longitude: 4.7206, region: "Kwara State" },
  // Ogun
  { name: "Abeokuta", latitude: 7.1475, longitude: 3.3619, region: "Ogun State" },
  { name: "Sagamu", latitude: 6.8489, longitude: 3.6465, region: "Ogun State" },
  { name: "Ijebu Ode", latitude: 6.8208, longitude: 3.9208, region: "Ogun State" },
  { name: "Ota", latitude: 6.6908, longitude: 3.2356, region: "Ogun State" },
  // Borno
  { name: "Maiduguri", latitude: 11.8311, longitude: 13.151, region: "Borno State" },
  // Imo
  { name: "Owerri", latitude: 5.4833, longitude: 7.0333, region: "Imo State" },
  // Delta
  { name: "Asaba", latitude: 6.1984, longitude: 6.7328, region: "Delta State" },
  { name: "Warri", latitude: 5.5442, longitude: 5.7603, region: "Delta State" },
  { name: "Ughelli", latitude: 5.5, longitude: 5.9833, region: "Delta State" },
  { name: "Sapele", latitude: 5.8944, longitude: 5.6767, region: "Delta State" },
  // Akwa Ibom
  { name: "Uyo", latitude: 5.0377, longitude: 7.9128, region: "Akwa Ibom State" },
  { name: "Eket", latitude: 4.6444, longitude: 7.9333, region: "Akwa Ibom State" },
  { name: "Ikot Ekpene", latitude: 5.1833, longitude: 7.7167, region: "Akwa Ibom State" },
  // Cross River
  { name: "Calabar", latitude: 4.9757, longitude: 8.3417, region: "Cross River State" },
  // Ondo
  { name: "Akure", latitude: 7.2571, longitude: 5.2058, region: "Ondo State" },
  { name: "Ondo", latitude: 7.0917, longitude: 4.8333, region: "Ondo State" },
  // Osun
  { name: "Osogbo", latitude: 7.7827, longitude: 4.5418, region: "Osun State" },
  { name: "Ile-Ife", latitude: 7.4833, longitude: 4.5667, region: "Osun State" },
  { name: "Ilesa", latitude: 7.6333, longitude: 4.75, region: "Osun State" },
  // Ekiti
  { name: "Ado-Ekiti", latitude: 7.6211, longitude: 5.2214, region: "Ekiti State" },
  // Kogi
  { name: "Lokoja", latitude: 7.8023, longitude: 6.743, region: "Kogi State" },
  { name: "Okene", latitude: 7.55, longitude: 6.2333, region: "Kogi State" },
  // Niger
  { name: "Minna", latitude: 9.6139, longitude: 6.5569, region: "Niger State" },
  { name: "Suleja", latitude: 9.18, longitude: 7.18, region: "Niger State" },
  { name: "Bida", latitude: 9.0833, longitude: 6.0167, region: "Niger State" },
  // Anambra
  { name: "Awka", latitude: 6.2209, longitude: 7.0716, region: "Anambra State" },
  { name: "Onitsha", latitude: 6.1664, longitude: 6.7865, region: "Anambra State" },
  { name: "Nnewi", latitude: 6.0199, longitude: 6.9173, region: "Anambra State" },
  // Abia
  { name: "Aba", latitude: 5.1066, longitude: 7.3667, region: "Abia State" },
  { name: "Umuahia", latitude: 5.5263, longitude: 7.4896, region: "Abia State" },
  // Benue
  { name: "Makurdi", latitude: 7.7327, longitude: 8.5392, region: "Benue State" },
  { name: "Otukpo", latitude: 7.1917, longitude: 8.1333, region: "Benue State" },
  // Nasarawa
  { name: "Lafia", latitude: 8.4932, longitude: 8.5153, region: "Nasarawa State" },
  { name: "Keffi", latitude: 8.8475, longitude: 7.8736, region: "Nasarawa State" },
  { name: "Karu", latitude: 9.0067, longitude: 7.6433, region: "Nasarawa State" },
  // Bauchi
  { name: "Bauchi", latitude: 10.3158, longitude: 9.8442, region: "Bauchi State" },
  // Gombe
  { name: "Gombe", latitude: 10.2897, longitude: 11.1673, region: "Gombe State" },
  // Adamawa
  { name: "Yola", latitude: 9.2094, longitude: 12.4818, region: "Adamawa State" },
  // Taraba
  { name: "Jalingo", latitude: 8.8937, longitude: 11.3596, region: "Taraba State" },
  // Sokoto
  { name: "Sokoto", latitude: 13.0627, longitude: 5.234, region: "Sokoto State" },
  // Katsina
  { name: "Katsina", latitude: 12.9908, longitude: 7.6018, region: "Katsina State" },
  { name: "Daura", latitude: 13.0333, longitude: 8.3167, region: "Katsina State" },
  // Kebbi
  { name: "Birnin Kebbi", latitude: 12.4539, longitude: 4.1975, region: "Kebbi State" },
  // Zamfara
  { name: "Gusau", latitude: 12.1628, longitude: 6.6614, region: "Zamfara State" },
  // Jigawa
  { name: "Dutse", latitude: 11.7562, longitude: 9.339, region: "Jigawa State" },
  // Yobe
  { name: "Damaturu", latitude: 11.747, longitude: 11.9608, region: "Yobe State" },
  // Bayelsa
  { name: "Yenagoa", latitude: 4.9267, longitude: 6.2676, region: "Bayelsa State" },
  // Ebonyi
  { name: "Abakaliki", latitude: 6.3249, longitude: 8.1137, region: "Ebonyi State" },
];

const FALLBACK: City = CITIES[0] as City;

export function cityByName(name: string): City {
  const normalized = name.trim().toLowerCase();
  const match = CITIES.find((c) => c.name.toLowerCase() === normalized);
  if (match) return match;

  // Partial match fallback (e.g. "Abuja Municipal" -> "Abuja")
  const partial = CITIES.find((c) => normalized.includes(c.name.toLowerCase()));
  if (partial) return partial;

  return {
    name: name.trim() || FALLBACK.name,
    latitude: FALLBACK.latitude,
    longitude: FALLBACK.longitude,
    region: "Local Area",
  };
}

export function nearestCity(latitude: number, longitude: number): City {
  let best = FALLBACK;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of CITIES) {
    const d = distanceKm(latitude, longitude, city.latitude, city.longitude);
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
  state?: string | null;
  country?: string | null;
}

/**
 * Normalizes city names (e.g. cleans up diacritics, LGA suffixes, administrative prefixes)
 */
function cleanCityName(raw: string): string {
  let name = raw.replace(/^(City of|Municipality of)\s+/i, "");
  name = name.replace(/\s+(Local Government Area|LGA|Municipal Area Council)$/i, "");
  name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // "Òṣogbo" -> "Osogbo"

  // Check if it matches any known city
  const known = CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return known ? known.name : name.trim();
}

function refinePlace(
  latitude: number,
  longitude: number,
  rawCity: string,
  rawArea: string | null,
  state?: string | null,
): { city: string; area: string | null } {
  let city = cleanCityName(rawCity);
  let area = rawArea && rawArea.toLowerCase() !== city.toLowerCase() ? rawArea : null;

  const nearest = nearestCity(latitude, longitude);
  const dist = distanceKm(latitude, longitude, nearest.latitude, nearest.longitude);

  // If very close to a major city (< 22km) and the geocoded name is an LGA or suburb
  if (dist < 22) {
    const isLgaOrDistrict = [
      "olorunda",
      "uvwie",
      "effurun",
      "municipal",
      "council",
      "area council",
      "central district",
      "metropolitan",
    ].some((term) => city.toLowerCase().includes(term));

    if (isLgaOrDistrict) {
      if (!area || area.toLowerCase() === city.toLowerCase()) area = city;
      city = nearest.name;
    }
  }

  return { city, area };
}

/**
 * Turns device coordinates into a real city plus neighbourhood.
 * Uses the backend geocoding proxy first (resilient against adblockers/CORS),
 * with client-side fallback to OpenStreetMap Nominatim and BigDataCloud.
 */
export async function resolvePlace(latitude: number, longitude: number): Promise<ResolvedPlace> {
  const nearest = nearestCity(latitude, longitude);

  // 1. Try our Express server backend geocoding proxy
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as {
        city?: string;
        area?: string | null;
        state?: string | null;
        country?: string | null;
      };
      if (data.city) {
        const { city, area } = refinePlace(
          latitude,
          longitude,
          data.city,
          data.area ?? null,
          data.state ?? null,
        );
        return {
          city,
          area,
          state: data.state ?? null,
          country: data.country ?? null,
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Client-side fallback: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      {
        headers: { "User-Agent": "PulseLocalIntelligence/1.0" },
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as {
        address?: Record<string, string>;
      };
      const addr: Record<string, string | undefined> = data.address ?? {};
      const state = addr["state"] || addr["province"] || addr["region"] || null;
      let city =
        addr["city"] ||
        addr["town"] ||
        addr["municipality"] ||
        addr["county"] ||
        addr["city_district"] ||
        addr["state_district"] ||
        null;
      const area =
        addr["suburb"] ||
        addr["neighbourhood"] ||
        addr["district"] ||
        addr["village"] ||
        addr["quarter"] ||
        null;

      if (
        state &&
        (state.toLowerCase().includes("federal capital territory") ||
          state.toLowerCase().includes("fct"))
      ) {
        city = "Abuja";
      }

      if (city) {
        const { city: refinedCity, area: refinedArea } = refinePlace(
          latitude,
          longitude,
          city,
          area,
          state,
        );
        return {
          city: refinedCity,
          area: refinedArea,
          state,
          country: addr["country"] ?? null,
        };
      }
    }
  } catch {
    // Continue
  }

  // 3. Client-side fallback: BigDataCloud
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      let city = data.city || data.locality || data.principalSubdivision;
      const area = data.locality || null;
      const state = data.principalSubdivision || null;

      if (state && (state.toLowerCase().includes("abuja") || state.toLowerCase().includes("fct"))) {
        city = "Abuja";
      }

      if (city) {
        const { city: refinedCity, area: refinedArea } = refinePlace(
          latitude,
          longitude,
          city,
          area,
          state,
        );
        return {
          city: refinedCity,
          area: refinedArea,
          state,
          country: data.countryName ?? null,
        };
      }
    }
  } catch {
    // Continue
  }

  // 4. Offline / unreachable fallback: Nearest known city using Haversine distance
  return {
    city: nearest.name,
    area: null,
    state: nearest.region,
    country: "Nigeria",
  };
}
