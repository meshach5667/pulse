import { LocateFixed, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES } from "@/lib/pulse/cities";
import { useProfile } from "@/lib/pulse/profile";

export function Onboarding() {
  const { createFromGps, createManual } = useProfile();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(false);
  const [city, setCity] = useState("Abuja");

  async function handleGps() {
    if (!name.trim()) return setMessage("Enter your name first.");
    setBusy(true);
    setMessage("Finding your region…");
    const r = await createFromGps(name);
    setBusy(false);
    if (!r.ok) {
      setMessage(`${r.message} You can choose your city instead.`);
      setManual(true);
    }
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
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Allow location access and Pulse will detect your region automatically — Abuja, Lagos,
          Ibadan and more.
        </p>

        <div className="mt-8 space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
        </div>

        <Button className="mt-6" size="lg" onClick={() => void handleGps()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          Detect my location
        </Button>

        {manual ? (
          <div className="mt-6 space-y-2 rounded-lg border border-border bg-card p-4">
            <Label>Choose your city</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}, {c.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => createManual(name, city)}
              disabled={!name.trim()}
            >
              Continue with {city}
            </Button>
          </div>
        ) : (
          <button
            className="mt-3 text-xs text-muted-foreground underline"
            onClick={() => setManual(true)}
          >
            Location unavailable? Choose a city
          </button>
        )}
        {message ? <p className="mt-3 text-xs text-muted-foreground">{message}</p> : null}
      </main>
    </div>
  );
}
