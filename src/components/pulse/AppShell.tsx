import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutList, Map, SquarePen, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: LayoutList },
  { to: "/map", label: "Map", icon: Map },
  { to: "/report", label: "Report", icon: SquarePen },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-card/70 blur-3xl" />
        <div className="absolute top-40 -right-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-24 -left-12 h-56 w-56 rounded-full bg-expired/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col">
        <div className="flex-1 pb-20">{children}</div>

        <nav className="glass-panel fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border">
          <div className="grid grid-cols-5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 transition-colors",
                    active ? "text-accent" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.7} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
