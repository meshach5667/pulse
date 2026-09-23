import { LocateFixed, MapPin, MessageSquareText, Radio, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatAgo } from "@/lib/pulse/geo";
import { useProfile } from "@/lib/pulse/profile";

export function PulseHeader({ lastUpdated }: { lastUpdated: number }) {
  const { profile, requestGps } = useProfile();
  const [, tick] = useState(0);
  const [online, setOnline] = useState(true);

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

  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold tracking-tight text-primary-foreground">
            P
          </span>
          <div className="leading-none">
            <p className="text-[15px] font-bold tracking-tight">PULSE</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Know what&rsquo;s happening around you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label="Ask Pulse"
          >
            <MessageSquareText className="size-[18px]" />
          </Button>

          <div className="flex items-center gap-1 rounded-full bg-card/70 py-1 pr-1.5 pl-2 ring-1 ring-border">
            <MapPin className="size-3.5 text-accent" />
            <span className="text-[12px] font-medium">{profile?.city ?? "Current location"}</span>
            <button
              type="button"
              onClick={() => void requestGps()}
              className="ml-1 text-muted-foreground hover:text-foreground"
              aria-label="Refresh current location"
              title="Refresh current location"
            >
              <LocateFixed className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {online ? (
            <>
              <span className="size-1.5 animate-pulse-dot rounded-full bg-confirmed" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="size-3.5" />
              Offline — showing the last received data
            </>
          )}
        </span>
        <span className="tabular flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Radio className="size-3" />
          Updated {formatAgo(new Date(lastUpdated).toISOString())}
        </span>
      </div>
    </header>
  );
}
