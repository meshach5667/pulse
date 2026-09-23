import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { resolvePlace } from "./cities";
import type { PulseProfile } from "./types";

const STORAGE_KEY = "pulse.profile.v1";

interface ProfileContextValue {
  profile: PulseProfile | null;
  hydrated: boolean;
  save: (profile: PulseProfile) => void;
  update: (patch: Partial<PulseProfile>) => void;
  clear: () => void;
  requestGps: () => Promise<{ ok: boolean; message: string }>;
  createFromGps: (name: string) => Promise<{ ok: boolean; message: string }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PulseProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PulseProfile;
        if (saved.gpsGranted) setProfile(saved);
      }
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

  const requestGps = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { ok: false, message: "This device cannot share a location." };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void resolvePlace(pos.coords.latitude, pos.coords.longitude).then((place) => {
            update({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              city: place,
              gpsGranted: true,
              simulatedTravel: false,
            });
            resolve({ ok: true, message: `Location set near ${place}.` });
          });
        },
        () => resolve({ ok: false, message: "Location permission was not granted." }),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  }, [update]);

  const createFromGps = useCallback(
    async (name: string): Promise<{ ok: boolean; message: string }> => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        return { ok: false, message: "This device cannot share a location." };
      }
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            void resolvePlace(pos.coords.latitude, pos.coords.longitude).then((place) => {
              persist({
                id: crypto.randomUUID(),
                name: name.trim() || "Anonymous",
                city: place,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                gpsGranted: true,
                notifications: true,
                simulatedTravel: false,
              });
              resolve({ ok: true, message: `Location set near ${place}.` });
            });
          },
          () => resolve({ ok: false, message: "Location permission was not granted." }),
          { enableHighAccuracy: true, timeout: 8000 },
        );
      });
    },
    [persist],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      hydrated,
      save: persist,
      update,
      clear: () => persist(null),
      requestGps,
      createFromGps,
    }),
    [profile, hydrated, persist, update, requestGps, createFromGps],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

export function makeProfile(
  name: string,
  place: string,
  latitude: number,
  longitude: number,
): PulseProfile {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Anonymous",
    city: place,
    latitude,
    longitude,
    gpsGranted: true,
    notifications: true,
    simulatedTravel: false,
  };
}
