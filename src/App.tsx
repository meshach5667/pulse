import { useEffect, useState } from "react";
import { Bell, FilePlus2, LayoutList, Map, UserRound } from "lucide-react";
import { EventCard } from "@/components/pulse/EventCard";
import { PulseHeader } from "@/components/pulse/PulseHeader";
import { ProfileProvider, useProfile } from "@/lib/pulse/profile";
import { fetchEvents, submitReport, subscribeToEvents } from "@/lib/pulse/api";
import { distanceKm } from "@/lib/pulse/geo";
import type { PulseEvent } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

function App() {
  return (
    <ProfileProvider>
      <PulseApp />
    </ProfileProvider>
  );
}

function PulseApp() {
  const { profile, hydrated } = useProfile();
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("Home");

  useEffect(() => {
    if (!hydrated || !profile) return;
    let mounted = true;
    const load = async () => {
      const next = await fetchEvents(profile.city);
      if (mounted) {
        setEvents(next);
        setLastUpdated(Date.now());
      }
    };
    void load();
    const stop = subscribeToEvents(() => void load());
    return () => {
      mounted = false;
      stop();
    };
  }, [hydrated, profile]);

  if (!hydrated) return null;
  if (!profile) return <Onboarding onComplete={() => undefined} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen w-full max-w-[430px] pb-20">
        <PulseHeader lastUpdated={lastUpdated} />
        <main className="space-y-3 px-3 py-4">
          <section className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                Local intelligence
              </p>
              <h1 className="mt-1 text-xl font-semibold">What is happening nearby</h1>
            </div>
            <span className="rounded-full bg-card px-2 py-1 text-[10px] text-muted-foreground ring-1 ring-border">
              {events.length} signals
            </span>
          </section>
          {activeTab === "Home" ? (
            events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                distance={distanceKm(
                  profile.latitude,
                  profile.longitude,
                  event.latitude,
                  event.longitude,
                )}
              />
            ))
          ) : activeTab === "Report" ? (
            <ReportView profile={profile} onSubmitted={() => setActiveTab("Home")} />
          ) : (
            <EmptyTab label={activeTab} />
          )}
        </main>
        <nav className="glass-panel fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border">
          <div className="grid grid-cols-5">
            {[
              ["Home", LayoutList],
              ["Map", Map],
              ["Report", FilePlus2],
              ["Alerts", Bell],
              ["Profile", UserRound],
            ].map(([label, Icon]) => (
              <button
                key={label as string}
                onClick={() => setActiveTab(label as string)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                  activeTab === label ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="size-[18px]" />
                <span>{label as string}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const { createFromGps } = useProfile();
  const [message, setMessage] = useState("");

  async function handleLocation() {
    if (!name.trim()) {
      setMessage("Enter your name first.");
      return;
    }
    const result = await createFromGps(name);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onComplete();
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-center px-6">
      <span className="mb-5 grid size-10 place-items-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
        P
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">PULSE</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Know what&apos;s happening around you.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Enter your name and allow location access. PULSE uses your device position to show the
        nearby place.
      </p>
      <label className="mt-8 text-xs font-semibold">
        Your name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg border bg-card px-3 py-3 text-sm outline-none ring-accent focus:ring-2"
          placeholder="Name"
        />
      </label>
      <button
        onClick={() => void handleLocation()}
        className="mt-6 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
      >
        Use my current location
      </button>
      {message ? <p className="mt-3 text-xs text-muted-foreground">{message}</p> : null}
    </main>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="font-semibold">{label}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This view is ready for live data from the Express API.
      </p>
    </section>
  );
}

function ReportView({
  profile,
  onSubmitted,
}: {
  profile: NonNullable<ReturnType<typeof useProfile>["profile"]>;
  onSubmitted: () => void;
}) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    if (!content.trim()) return;
    setBusy(true);
    setMessage("Report received. Analyzing it now…");
    try {
      await submitReport({
        content,
        city: profile.city,
        latitude: profile.latitude,
        longitude: profile.longitude,
      });
      onSubmitted();
    } catch {
      setMessage("The report is saved locally for review when the API reconnects.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        New report
      </p>
      <h2 className="mt-1 text-lg font-semibold">What did you observe?</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Your report appears as an early signal immediately. Pulse will attach analysis and evidence
        as they arrive.
      </p>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="mt-4 min-h-32 w-full resize-y rounded-lg border bg-background p-3 text-sm outline-none ring-accent focus:ring-2"
        placeholder="I just heard loud sounds near Central Market…"
      />
      <button
        disabled={busy || !content.trim()}
        onClick={() => void handleSubmit()}
        className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Analyzing this report…" : "Submit early signal"}
      </button>
      {message ? <p className="mt-3 text-xs text-muted-foreground">{message}</p> : null}
    </section>
  );
}

export default App;
