import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, LocateFixed, MapPin, MessageSquareText, Radio, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TRAVEL_ROUTE } from "@/lib/pulse/cities";
import { formatAgo } from "@/lib/pulse/geo";
import { useProfile } from "@/lib/pulse/profile";
import { toast } from "sonner";

export function PulseHeader() {
  const { profile, setCity, requestGps } = useProfile();
  const [, tick] = useState(0);
  const [online, setOnline] = useState(true);
  const [locating, setLocating] = useState(false);
  const fetching = useIsFetching({ queryKey: ["pulse", "events"] });
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());

  useEffect(() => {
    if (fetching === 0) setLastUpdated(Date.now());
  }, [fetching]);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  async function useDevice() {
    setLocating(true);
    const r = await requestGps();
    setLocating(false);
    if (r.ok) toast.success(r.message);
    else toast.error(r.message);
  }

  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            P
          </span>
          <p className="text-[15px] font-bold tracking-tight">PULSE</p>
        </Link>
        <span className="hidden items-center gap-1.5 text-[12px] font-medium text-muted-foreground lg:flex">
          {online ? (
            <>
              <span className="size-1.5 animate-pulse-dot rounded-full bg-confirmed" /> Live
            </>
          ) : (
            <>
              <WifiOff className="size-3.5" /> Offline — showing the last received data
            </>
          )}
          <span className="mx-2 text-border">|</span>
          <Radio className="size-3" />
          <span className="tabular font-mono">Updated {formatAgo(new Date(lastUpdated).toISOString())}</span>
        </span>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="icon" className="size-8 text-muted-foreground lg:hidden">
            <Link to="/ask" aria-label="Ask Pulse">
              <MessageSquareText className="size-[18px]" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded-full bg-card/80 py-1 pr-2 pl-2.5 ring-1 ring-border">
              <MapPin className="size-3.5 text-accent" />
              <span className="max-w-[160px] truncate text-[12px] font-medium">
                {profile?.city}
                {profile?.area ? <span className="text-muted-foreground"> · {profile.area}</span> : null}
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => void useDevice()} disabled={locating}>
                <LocateFixed className="size-4" />
                {locating ? "Locating…" : "Use device location"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] text-muted-foreground">Simulate travel</DropdownMenuLabel>
              {TRAVEL_ROUTE.map((c) => (
                <DropdownMenuItem key={c} onClick={() => setCity(c)}>
                  {profile?.city === c ? <Check className="size-4" /> : <span className="size-4" />}
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-2.5 lg:hidden">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {online ? (
            <>
              <span className="size-1.5 animate-pulse-dot rounded-full bg-confirmed" /> Live
            </>
          ) : (
            <>
              <WifiOff className="size-3.5" /> Offline
            </>
          )}
        </span>
        <span className="tabular flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Radio className="size-3" /> Updated {formatAgo(new Date(lastUpdated).toISOString())}
        </span>
      </div>
    </header>
  );
}
