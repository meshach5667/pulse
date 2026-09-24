import { LocateFixed, Loader2, MapPin, Search, Check } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITIES, type City, resolvePlace } from "@/lib/pulse/cities";
import { useProfile } from "@/lib/pulse/profile";

export function Onboarding() {
  const { createManual } = useProfile();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0] as City);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [remoteResults, setRemoteResults] = useState<
    Array<{
      city: string;
      area: string | null;
      state: string | null;
      latitude: number;
      longitude: number;
      display_name: string;
    }>
  >([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Local instant search
  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CITIES.slice(0, 14);
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q),
    ).slice(0, 16);
  }, [search]);

  // Remote geocoding search for custom towns
  useEffect(() => {
    const q = search.trim();
    if (q.length < 3 || filteredCities.length > 2) {
      setRemoteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setRemoteResults(data);
        }
      } catch {
        // ignore
      } finally {
        setIsSearchingRemote(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, filteredCities.length]);

  async function handleGpsDetect() {
    setBusy(true);
    setMessage("Detecting your exact coordinates…");
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
              navigator.geolocation.getCurrentPosition(
                resolve,
                () => reject(new Error("Unable to determine your device's location.")),
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
              );
            } else {
              reject(new Error("Location permission was not granted."));
            }
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 },
        );
      });

      setMessage("Resolving local region and neighborhood…");
      const place = await resolvePlace(pos.coords.latitude, pos.coords.longitude);

      setSelectedCity({
        name: place.city,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        region: place.state ?? "Local Region",
      });
      setSelectedArea(place.area);
      setMessage(`Detected: ${place.area ? `${place.area}, ` : ""}${place.city}`);
    } catch (error) {
      setMessage((error as Error).message || "Location detection failed. Please search below.");
      setShowPicker(true);
    } finally {
      setBusy(false);
    }
  }

  function handleFinish() {
    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }
    createManual(name, selectedCity.name, {
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      area: selectedArea,
    });
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <p className="text-sm font-bold tracking-[0.2em]">PULSE</p>
        <div className="space-y-4">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Information travels fast. Pulse shows how much of it is established.
          </h2>
          <p className="max-w-md text-sm opacity-70">
            Early signal, corroborated, confirmed, disputed, false, expired. Every state explained,
            every source counted once.
          </p>
        </div>
        <p className="text-xs opacity-50">Pulse never declares a location safe.</p>
      </section>

      <main className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <span className="mb-5 grid size-10 place-items-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          P
        </span>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">Pulse</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Know what&apos;s happening around you.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Real-time, verified local intelligence for your community.
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Chioma or Meshach"
          />
        </div>

        <div className="mt-5 space-y-2">
          <Label>Your location</Label>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <MapPin className="size-4 shrink-0 text-accent" />
              <div className="truncate">
                <p className="text-sm font-semibold text-foreground">
                  {selectedArea ? `${selectedArea}, ` : ""}
                  {selectedCity.name}
                </p>
                <p className="text-xs text-muted-foreground">{selectedCity.region}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPicker(!showPicker)}
            >
              {showPicker ? "Close" : "Change"}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2 text-xs"
            onClick={() => void handleGpsDetect()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LocateFixed className="size-3.5 text-accent" />
            )}
            {busy ? "Detecting…" : "Auto-detect with GPS"}
          </Button>
        </div>

        {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}

        {showPicker && (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city, town, or state (e.g. Uyo, Ikeja, Warri)..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {remoteResults.length > 0 && (
                <div className="mb-2">
                  <p className="px-1 pb-1 text-[10px] font-semibold text-muted-foreground uppercase">
                    Search results
                  </p>
                  {remoteResults.map((r, i) => (
                    <button
                      key={`${r.city}-${i}`}
                      type="button"
                      onClick={() => {
                        setSelectedCity({
                          name: r.city,
                          latitude: r.latitude,
                          longitude: r.longitude,
                          region: r.state ?? "Nigeria",
                        });
                        setSelectedArea(r.area);
                        setShowPicker(false);
                      }}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      <div>
                        <span className="font-medium text-foreground">
                          {r.area ? `${r.area}, ` : ""}
                          {r.city}
                        </span>
                        <span className="ml-1 text-muted-foreground">({r.state ?? "Nigeria"})</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <p className="px-1 pb-1 text-[10px] font-semibold text-muted-foreground uppercase">
                {search ? "Matching cities" : "Major cities"}
              </p>
              {filteredCities.map((c) => {
                const isSelected = selectedCity.name.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedCity(c);
                      setSelectedArea(null);
                      setShowPicker(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                      isSelected ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <div>
                      <span>{c.name}</span>
                      <span className="ml-1.5 text-[11px] text-muted-foreground">{c.region}</span>
                    </div>
                    {isSelected && <Check className="size-3 text-primary" />}
                  </button>
                );
              })}

              {isSearchingRemote && (
                <div className="flex items-center justify-center gap-1.5 py-2 text-[11px] text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Searching…
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          className="mt-6 w-full py-5 text-sm font-semibold"
          size="lg"
          onClick={handleFinish}
          disabled={!name.trim()}
        >
          Continue to Pulse ({selectedCity.name})
        </Button>
      </main>
    </div>
  );
}
