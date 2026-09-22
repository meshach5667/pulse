import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CITIES, cityByName, nearestCity } from "./cities";
import type { PulseProfile } from "./types";

const STORAGE_KEY = "pulse.profile.v1";

interface ProfileContextValue {
  profile: PulseProfile | null;
  hydrated: boolean;
  save: (profile: PulseProfile) => void;
  update: (patch: Partial<PulseProfile>) => void;
  setCity: (cityName: string, simulated?: boolean) => void;
  clear: () => void;
  requestGps: () => Promise<{ ok: boolean; message: string }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PulseProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw) as PulseProfile);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: PulseProfile | null) => {
    setProfile(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const update = useCallback(
    (patch: Partial<PulseProfile>) => {
      setProfile((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
    },
    [],
  );

  const setCity = useCallback(
    (cityName: string, simulated = true) => {
      const city = cityByName(cityName);
      update({
        city: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        simulatedTravel: simulated,
        gpsGranted: simulated ? false : true,
      });
    },
    [update],
  );

  const requestGps = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { ok: false, message: "This device cannot share a location." };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
          update({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: city.name,
            gpsGranted: true,
            simulatedTravel: false,
          });
          resolve({ ok: true, message: `Location set near ${city.name}.` });
        },
        () => resolve({ ok: false, message: "Location permission was not granted." }),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  }, [update]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      hydrated,
      save: persist,
      update,
      setCity,
      clear: () => persist(null),
      requestGps,
    }),
    [profile, hydrated, persist, update, setCity, requestGps],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

export function makeProfile(name: string, cityName: string): PulseProfile {
  const city = cityByName(cityName) ?? CITIES[0];
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Anonymous",
    city: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    gpsGranted: false,
    notifications: true,
    simulatedTravel: false,
  };
}
