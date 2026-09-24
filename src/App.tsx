import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Circle,
  FileText,
  Image,
  LayoutList,
  Map as MapIcon,
  MessageSquareText,
  Play,
  RefreshCw,
  Send,
  SquarePen,
  UserRound,
  Video,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { EventCard } from "@/components/pulse/EventCard";
import { EvidencePanel } from "@/components/pulse/EvidencePanel";
import { EvidenceTimeline } from "@/components/pulse/EvidenceTimeline";
import { Onboarding } from "@/components/pulse/Onboarding";
import { PulseHeader } from "@/components/pulse/PulseHeader";
import { LocationModal } from "@/components/pulse/LocationModal";
import { StatusBadge } from "@/components/pulse/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { askPulse } from "@/lib/pulse/ai.functions";
import { useEvent, useEvents, useLiveUpdates } from "@/lib/pulse/data";
import { distanceKm, formatDistance } from "@/lib/pulse/geo";
import { decayedState, relevanceScore } from "@/lib/pulse/freshness";
import { submitReport } from "@/lib/pulse/pipeline";
import { useProfile } from "@/lib/pulse/profile";
import type { PulseEvent, TruthState } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

const NAV = [
  ["home", "Home", LayoutList],
  ["map", "Map", MapIcon],
  ["report", "Report", SquarePen],
  ["alerts", "Alerts", Bell],
  ["profile", "Profile", UserRound],
] as const;
const STATE_COLORS: Record<TruthState, string> = {
  early_signal: "#c9951a",
  corroborated: "#d47a2d",
  confirmed: "#c4493d",
  disputed: "#718096",
  false: "#263244",
  expired: "#3974a8",
};

export default function App() {
  const { profile, hydrated } = useProfile();
  const [view, setView] = useState("home");
  const [selectedEvent, setSelectedEvent] = useState<PulseEvent | null>(null);
  useLiveUpdates();
  if (!hydrated) return <div className="min-h-screen bg-background" />;
  if (!profile) return <Onboarding />;
  if (selectedEvent)
    return (
      <AppFrame view="event" setView={setView} onNavigate={setView}>
        <EventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />
      </AppFrame>
    );
  return (
    <AppFrame view={view} setView={setView} onNavigate={setView}>
      <ViewContent view={view} onOpenEvent={setSelectedEvent} />
    </AppFrame>
  );
}

function AppFrame({
  children,
  view,
  setView,
  onNavigate,
}: {
  children: React.ReactNode;
  view: string;
  setView: (view: string) => void;
  onNavigate: (view: string) => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="glass-panel sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border p-4 lg:flex">
          <button
            type="button"
            className="flex items-center gap-2 px-2 py-1 text-left"
            onClick={() => setView("home")}
          >
            <span className="grid size-8 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              P
            </span>
            <span>
              <strong className="block text-base tracking-tight">PULSE</strong>
              <small className="text-[10px] text-muted-foreground">Local intelligence</small>
            </span>
          </button>
          <nav className="mt-8 space-y-1">
            {NAV.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  view === id
                    ? "bg-card text-accent ring-1 ring-border"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setView("ask")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                view === "ask"
                  ? "bg-card text-accent ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <MessageSquareText className="size-4" />
              Ask Pulse
            </button>
            <button
              type="button"
              onClick={() => setView("demo")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                view === "demo"
                  ? "bg-card text-accent ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <Play className="size-4" />
              Demo mode
            </button>
          </nav>
          <p className="mt-auto rounded-lg bg-card/70 p-3 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-border">
            Pulse shows information immediately and labels uncertainty. It never declares a place
            safe.
          </p>
        </aside>
        <div className="min-w-0 flex-1">
          <PulseHeader onNavigate={onNavigate} />
          <main className="mx-auto w-full max-w-6xl px-3 pt-4 pb-24 sm:px-6 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
      <nav className="glass-panel fixed inset-x-0 bottom-0 z-30 border-t border-border lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {NAV.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                view === id ? "text-accent" : "text-muted-foreground",
              )}
            >
              <Icon className="size-[18px]" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ViewContent({
  view,
  onOpenEvent,
}: {
  view: string;
  onOpenEvent: (event: PulseEvent) => void;
}) {
  if (view === "map") return <MapView />;
  if (view === "report") return <ReportView />;
  if (view === "alerts") return <AlertsView onOpenEvent={onOpenEvent} />;
  if (view === "profile") return <ProfileView />;
  if (view === "ask") return <AskView />;
  if (view === "demo") return <DemoView />;
  return <HomeView onOpenEvent={onOpenEvent} />;
}

function HomeView({ onOpenEvent }: { onOpenEvent: (event: PulseEvent) => void }) {
  const { profile } = useProfile();
  const query = useEvents();
  const events = useMemo(
    () =>
      (query.data ?? [])
        .map((event) => ({
          event,
          distance: distanceKm(
            profile!.latitude,
            profile!.longitude,
            event.latitude,
            event.longitude,
          ),
        }))
        .sort((a, b) => relevanceScore(b.event, b.distance) - relevanceScore(a.event, a.distance)),
    [profile, query.data],
  );
  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-4 sm:p-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          Local pulse
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          What&apos;s happening around {profile?.city}?
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Signals are ranked by distance, freshness and independent evidence. Read the status before
          acting on a claim.
        </p>
      </section>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Live feed</h2>
          <p className="text-xs text-muted-foreground">
            {events.length} signal{events.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void query.refetch()}
          aria-label="Refresh feed"
        >
          <RefreshCw className={cn(query.isFetching && "animate-spin")} />
        </Button>
      </div>
      {query.isLoading ? <State label="Loading the latest signals…" /> : null}
      {events.map(({ event, distance }, index) => (
        <EventCard
          key={event.id}
          event={event}
          distance={distance}
          index={index}
          onOpen={onOpenEvent}
        />
      ))}
    </div>
  );
}

function ReportView() {
  const { profile } = useProfile();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function send() {
    if (!profile || !content.trim()) return;
    setBusy(true);
    setMessage("Analyzing this report…");
    try {
      await submitReport({
        profile,
        content,
        locationName: profile.area ?? profile.city,
        channel: "text",
        hasImage: false,
        hasVideo: false,
        mediaNames: [],
      });
      setContent("");
      setMessage("Early signal created. It will update as evidence arrives.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The report could not be submitted.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="Report something" eyebrow="New report">
      <section className="glass max-w-2xl rounded-2xl p-4 sm:p-6">
        <Label htmlFor="report">What did you observe?</Label>
        <Textarea
          id="report"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-2 min-h-36"
          placeholder="I just heard loud sounds near Central Market…"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Location attached: {profile?.city}</p>
          <Button onClick={() => void send()} disabled={busy || !content.trim()}>
            {busy ? "Analyzing…" : "Submit report"}
            <Send />
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{message}</p>
      </section>
    </Page>
  );
}

function MapView() {
  const { profile } = useProfile();
  const query = useEvents();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !profile) return;
    const map = L.map(ref.current).setView([profile.latitude, profile.longitude], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    L.circleMarker([profile.latitude, profile.longitude], {
      radius: 7,
      color: "#315c9b",
      fillColor: "#315c9b",
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip("Your current location");
    for (const event of query.data ?? []) {
      const color = STATE_COLORS[event.truth_state];
      L.circleMarker([event.latitude, event.longitude], {
        radius: 9,
        color,
        fillColor: color,
        fillOpacity: 0.8,
      })
        .addTo(map)
        .bindPopup(`<strong>${event.title}</strong><br>${event.location_name}`);
    }
    return () => {
      map.remove();
    };
  }, [profile, query.data]);
  return (
    <Page title={`Signals around ${profile?.city}`} eyebrow="Live map">
      <p className="mb-3 text-sm text-muted-foreground">
        Markers show reports, not safe or unsafe zones.
      </p>
      <div
        ref={ref}
        className="h-[min(68vh,620px)] min-h-[360px] overflow-hidden rounded-2xl border border-border"
      />
    </Page>
  );
}

function AlertsView({ onOpenEvent }: { onOpenEvent: (event: PulseEvent) => void }) {
  const { profile } = useProfile();
  const query = useEvents();
  const events = (query.data ?? []).filter(
    (event) => event.city.toLowerCase() === profile?.city.toLowerCase(),
  );
  return (
    <Page title="Relevant updates" eyebrow="Alerts">
      <div className="space-y-3">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onOpenEvent(event)}
            className="flex w-full items-start gap-3 rounded-xl bg-card p-4 text-left ring-1 ring-border hover:ring-accent"
          >
            <Bell className="mt-1 size-4 text-accent" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap justify-between gap-2 font-medium">
                {event.title}
                <StatusBadge state={event.truth_state} />
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {event.location_name} · {event.independent_sources} independent source
                {event.independent_sources === 1 ? "" : "s"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Page>
  );
}

function ProfileView() {
  const { profile, requestGps, update, clear } = useProfile();
  const [locationOpen, setLocationOpen] = useState(false);
  return (
    <Page title="Your Pulse settings" eyebrow="Profile">
      <section className="glass max-w-2xl rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {profile?.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{profile?.name}</p>
            <p className="text-sm text-muted-foreground">
              {profile?.area ? `${profile.area}, ` : ""}
              {profile?.city}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium">Device location</p>
            <p className="text-xs text-muted-foreground">
              {profile?.area ? `${profile.area}, ` : ""}
              {profile?.city} ({profile?.latitude.toFixed(4)}, {profile?.longitude.toFixed(4)})
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocationOpen(true)}>
              Change Location
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void requestGps()}>
              Refresh GPS
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm">Relevant alerts</p>
          <input
            type="checkbox"
            checked={profile?.notifications ?? false}
            onChange={(event) => update({ notifications: event.target.checked })}
          />
        </div>
      </section>
      <Button variant="destructive" className="mt-4" onClick={clear}>
        Reset profile
      </Button>
      <LocationModal open={locationOpen} onOpenChange={setLocationOpen} />
    </Page>
  );
}

function AskView() {
  const { profile } = useProfile();
  const query = useEvents();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask() {
    if (!profile || !question.trim()) return;
    setBusy(true);
    try {
      const result = await askPulse({
        question,
        city: profile.city,
        context: JSON.stringify(query.data ?? []),
      });
      setAnswer(result.answer);
      setQuestion("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="Ask about your area" eyebrow="Ask Pulse">
      <section className="glass max-w-2xl rounded-2xl p-4 sm:p-6">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-28 w-full rounded-lg border bg-background p-3 text-sm"
          placeholder="What is happening around me?"
        />
        <Button className="mt-3" onClick={() => void ask()} disabled={busy || !question.trim()}>
          {busy ? "Thinking…" : "Ask Pulse"}
          <MessageSquareText />
        </Button>
        {answer ? (
          <p className="mt-5 rounded-xl bg-card p-4 text-sm leading-relaxed ring-1 ring-border">
            {answer}
          </p>
        ) : null}
      </section>
    </Page>
  );
}

function DemoView() {
  const [step, setStep] = useState(0);
  const steps = [
    "First report received: early signal",
    "Copied reports identified: still early signal",
    "Independent eyewitnesses: corroborated",
    "Credible local source: confirmed",
    "Contradictory report: disputed evidence shown",
  ];
  return (
    <Page title="How an event earns a truth state" eyebrow="Demo mode">
      <section className="glass max-w-3xl rounded-2xl p-4 sm:p-6">
        <div className="space-y-3">
          {steps.map((item, index) => (
            <div
              key={item}
              className={cn(
                "flex gap-3 border-l pl-4 text-sm",
                index <= step
                  ? "border-accent text-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              <span>
                {index <= step ? (
                  <CheckCircle2 className="size-4 text-accent" />
                ) : (
                  <Circle className="size-4" />
                )}
              </span>
              {item}
            </div>
          ))}
        </div>
        <Button
          className="mt-6"
          onClick={() => setStep((value) => Math.min(value + 1, steps.length - 1))}
          disabled={step === steps.length - 1}
        >
          Next evidence
          <Play />
        </Button>
      </section>
    </Page>
  );
}

function EventDetail({ event, onBack }: { event: PulseEvent; onBack: () => void }) {
  const { profile } = useProfile();
  const query = useEvent(event.id);
  const data = query.data;
  const distance = profile
    ? distanceKm(profile.latitude, profile.longitude, event.latitude, event.longitude)
    : 0;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" onClick={onBack}>
        Back to feed
      </Button>
      <section className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {event.location_name} · {formatDistance(distance)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{event.title}</h1>
          </div>
          <StatusBadge state={decayedState(event)} size="md" />
        </div>
        <p className="mt-4 text-sm leading-relaxed">{event.description}</p>
      </section>
      {data ? (
        <>
          <EvidencePanel
            event={{ ...event, truth_state: decayedState(event) }}
            distance={distance}
            evidence={data.evidence}
          />
          <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <h2 className="font-semibold">Evidence timeline</h2>
            <div className="mt-4">
              <EvidenceTimeline entries={data.timeline} />
            </div>
          </section>
          <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <h2 className="font-semibold">Reports</h2>
            {data.reports.map((report) => (
              <div key={report.id} className="mt-3 flex gap-2 border-t border-border pt-3 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                {report.content}
              </div>
            ))}
          </section>
        </>
      ) : (
        <State label="Loading event evidence…" />
      )}
    </div>
  );
}

function Page({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <section>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      </section>
      {children}
    </div>
  );
}
function State({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
