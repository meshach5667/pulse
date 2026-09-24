import { useState, useMemo, useEffect } from "react";
import { LocateFixed, MapPin, Search, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITIES, type City } from "@/lib/pulse/cities";
import { useProfile } from "@/lib/pulse/profile";
import { toast } from "sonner";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationModal({ open, onOpenChange }: LocationModalProps) {
  const { profile, requestGps, setCity } = useProfile();
  const [search, setSearch] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [remoteResults, setRemoteResults] = useState<
    Array<{
      city: string;
      area: string | null;
      state: string | null;
      country: string | null;
      latitude: number;
      longitude: number;
      display_name: string;
    }>
  >([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  // Local instant search
  const filteredLocal = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CITIES.slice(0, 16);
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [search]);

  // Remote geocoding search for custom towns/LGAs
  useEffect(() => {
    const q = search.trim();
    if (q.length < 3 || filteredLocal.length > 3) {
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
  }, [search, filteredLocal.length]);

  async function handleGps() {
    setDetecting(true);
    const res = await requestGps();
    setDetecting(false);
    if (res.ok) {
      toast.success(res.message);
      onOpenChange(false);
    } else {
      toast.error(res.message || "Could not detect location. Please choose a city below.");
    }
  }

  function handleSelectCity(city: City) {
    setCity(city.name, {
      latitude: city.latitude,
      longitude: city.longitude,
      area: null,
    });
    toast.success(`Location set to ${city.name}, ${city.region}`);
    onOpenChange(false);
  }

  function handleSelectRemote(item: {
    city: string;
    area: string | null;
    state: string | null;
    latitude: number;
    longitude: number;
  }) {
    setCity(item.city, {
      latitude: item.latitude,
      longitude: item.longitude,
      area: item.area,
    });
    toast.success(`Location set to ${item.area ? `${item.area}, ` : ""}${item.city}`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MapPin className="size-5 text-accent" />
            Set your location
          </DialogTitle>
          <DialogDescription>
            Choose your city or detect your exact GPS coordinates to view relevant nearby reports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Button
            type="button"
            className="w-full justify-center gap-2 py-5 text-sm font-semibold"
            onClick={() => void handleGps()}
            disabled={detecting}
          >
            {detecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LocateFixed className="size-4 text-accent" />
            )}
            {detecting ? "Acquiring precise location…" : "Detect current location with GPS"}
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city, town, or state (e.g. Uyo, Ikeja, Warri)..."
              className="pl-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
            {remoteResults.length > 0 && (
              <div className="mb-2">
                <p className="px-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Search results
                </p>
                {remoteResults.map((r, i) => (
                  <button
                    key={`${r.city}-${i}`}
                    type="button"
                    onClick={() => handleSelectRemote(r)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {r.area ? `${r.area}, ` : ""}
                        {r.city}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.state ? `${r.state}, ` : ""}
                        {r.country ?? "Nigeria"}
                      </p>
                    </div>
                    {profile?.city.toLowerCase() === r.city.toLowerCase() && (
                      <Check className="size-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="px-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {search ? "Matching cities" : "Major cities & states"}
            </p>

            {filteredLocal.map((c) => {
              const isSelected = profile?.city.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectCity(c)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{c.region}</span>
                  </div>
                  {isSelected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}

            {isSearchingRemote && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Searching more locations…
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
