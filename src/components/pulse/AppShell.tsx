import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutList, Map, MessageSquareText, PlayCircle, SquarePen, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { Onboarding } from "@/components/pulse/Onboarding";
import { PulseHeader } from "@/components/pulse/PulseHeader";
import { useLiveUpdates } from "@/lib/pulse/data";
import { useProfile } from "@/lib/pulse/profile";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: LayoutList },
  { to: "/map", label: "Map", icon: Map },
  { to: "/report", label: "Report", icon: SquarePen },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

const EXTRA = [
  { to: "/ask", label: "Ask Pulse", icon: MessageSquareText },
  { to: "/demo", label: "Demo mode", icon: PlayCircle },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, hydrated } = useProfile();
  useLiveUpdates();

  if (!hydrated) return <div className="min-h-screen bg-background" />;
  if (!profile) return <Onboarding />;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="glass-panel sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border p-4 lg:flex">
          <Link to="/" className="flex items-center gap-2 px-2 py-1">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              P
            </span>
            <div className="leading-none">
              <p className="text-base font-bold tracking-tight">PULSE</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Local intelligence</p>
            </div>
          </Link>
          <nav className="mt-8 space-y-1">
            {[...NAV, ...EXTRA].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(to)
                    ? "bg-card text-accent ring-1 ring-border"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-lg bg-card/70 p-3 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-border">
            Pulse shows information immediately and labels uncertainty. It never declares a place safe.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <PulseHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-4 pb-24 sm:px-6 lg:pb-10">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="glass-panel fixed inset-x-0 bottom-0 z-30 border-t border-border lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 transition-colors",
                isActive(to) ? "text-accent" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={isActive(to) ? 2.2 : 1.7} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
