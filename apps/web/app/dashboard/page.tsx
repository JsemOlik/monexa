"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Monitor, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <ComputersGrid />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ComputersGrid() {
  const computers = useQuery(api.computers.list);
  const [cachedCount, setCachedCount] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("monexa_computer_count");
    if (saved) setCachedCount(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (computers !== undefined) {
      localStorage.setItem(
        "monexa_computer_count",
        computers.length.toString(),
      );
      setCachedCount(computers.length);
    }
  }, [computers]);

  // Initial loading state or no computers registered
  if (computers === undefined) {
    if (!cachedCount) {
      return <CenteredLoading />;
    }
    // Show skeletons if we have a cached count
    return (
      <>
        {Array.from({ length: cachedCount }).map((_, i) => (
          <ComputerSkeleton key={i} />
        ))}
      </>
    );
  }

  if (computers.length === 0) {
    return <CenteredLoading />;
  }

  return (
    <>
      {computers.map((computer) => (
        <Card key={computer.id} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {computer.name}
            </CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground uppercase">
              {computer.os}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Circle
                className={`h-2.5 w-2.5 fill-current ${
                  computer.status === "online"
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              />
              <span className="text-sm font-medium capitalize">
                {computer.status}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Last seen: {new Date(computer.lastSeen).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function CenteredLoading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background/50 backdrop-blur-sm z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading Computers...
        </p>
      </div>
    </div>
  );
}

function ComputerSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Monitor className="h-4 w-4 text-muted-foreground opacity-50" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-[60px]" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-4 w-[50px]" />
        </div>
        <Skeleton className="mt-2 h-3 w-[120px]" />
      </CardContent>
    </Card>
  );
}
