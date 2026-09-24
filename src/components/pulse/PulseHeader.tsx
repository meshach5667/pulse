import { LocateFixed, MapPin, MessageSquareText, Radio, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { formatAgo } from "@/lib/pulse/geo";
import { useProfile } from "@/lib/pulse/profile";

import { LocationModal } from "./LocationModal";

export function PulseHeader({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const { profile } = useProfile();
  const fetching = useIsFetching({ queryKey: ["pulse", "events"] });
  const [online, setOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    if (fetching === 0) setLastUpdated(Date.now());
  }, [fetching]);

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
    <>
      <header className="glass-panel sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate?.("home")}
            className="flex items-center gap-2"
          >
            <span className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
              P
            </span>
            <span className="text-[15px] font-bold tracking-tight">PULSE</span>
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={() => onNavigate?.("ask")}
              aria-label="Ask Pulse"
            >
              <MessageSquareText className="size-[18px]" />
            </Button>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="flex max-w-[210px] items-center gap-1.5 rounded-full bg-card/80 py-1 pr-2.5 pl-2.5 ring-1 ring-border hover:bg-card transition-colors cursor-pointer"
              title="Change or refresh location"
            >
              <MapPin className="size-3.5 shrink-0 text-accent" />
              <span className="truncate text-[12px] font-medium">
                {profile?.area ? `${profile.area}, ` : ""}
                {profile?.city ?? "Set location"}
              </span>
              <LocateFixed className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-2.5 text-[11px] text-muted-foreground sm:px-6">
          <span className="flex items-center gap-1.5">
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
          <span className="flex items-center gap-1.5 font-mono tabular">
            <Radio className="size-3" /> Updated {formatAgo(new Date(lastUpdated).toISOString())}
          </span>
        </div>
      </header>
      <LocationModal open={locationOpen} onOpenChange={setLocationOpen} />
    </>
  );
}
