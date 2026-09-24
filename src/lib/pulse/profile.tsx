import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cityByName, resolvePlace } from "./cities";
import type { PulseProfile } from "./types";

const STORAGE_KEY = "pulse.profile.v2";

type Result = { ok: boolean; message: string };

interface ProfileContextValue {
  profile: PulseProfile | null;
  hydrated: boolean;
  update: (patch: Partial<PulseProfile>) => void;
  setCity: (cityName: string) => void;
  clear: () => void;
  requestGps: () => Promise<Result>;
  createFromGps: (name: string) => Promise<Result>;
  createManual: (name: string, city: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This device cannot share a location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error("Location permission was not granted.")), {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  });
}

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

  const update = useCallback((patch: Partial<PulseProfile>) => {
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
  }, []);

  const setCity = useCallback(
    (cityName: string) => {
      const c = cityByName(cityName);
      update({ city: c.name, area: null, latitude: c.latitude, longitude: c.longitude, simulatedTravel: true });
    },
    [update],
  );

  const requestGps = useCallback(async (): Promise<Result> => {
    try {
      const pos = await getPosition();
      const place = await resolvePlace(pos.coords.latitude, pos.coords.longitude);
      update({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        city: place.city,
        area: place.area,
        gpsGranted: true,
        simulatedTravel: false,
      });
      return { ok: true, message: `Location set to ${place.city}.` };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [update]);

  const createFromGps = useCallback(
    async (name: string): Promise<Result> => {
      try {
        const pos = await getPosition();
        const place = await resolvePlace(pos.coords.latitude, pos.coords.longitude);
        persist({
          id: crypto.randomUUID(),
          name: name.trim() || "Anonymous",
          city: place.city,
          area: place.area,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          gpsGranted: true,
          notifications: true,
          simulatedTravel: false,
        });
        return { ok: true, message: `Location set to ${place.city}.` };
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    },
    [persist],
  );

  const createManual = useCallback(
    (name: string, cityName: string) => {
      const c = cityByName(cityName);
      persist({
        id: crypto.randomUUID(),
        name: name.trim() || "Anonymous",
        city: c.name,
        area: null,
        latitude: c.latitude,
        longitude: c.longitude,
        gpsGranted: false,
        notifications: true,
        simulatedTravel: false,
      });
    },
    [persist],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      hydrated,
      update,
      setCity,
      clear: () => persist(null),
      requestGps,
      createFromGps,
      createManual,
    }),
    [profile, hydrated, update, setCity, persist, requestGps, createFromGps, createManual],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
