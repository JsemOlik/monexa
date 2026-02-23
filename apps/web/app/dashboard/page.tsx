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
import { ComputerCard } from "@/components/computer-card";

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
          <div className="grid auto-rows-min gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
        <ComputerCard key={computer.id} computer={computer} />
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
    <Card className="overflow-hidden border border-border/10 border-t-[6px] border-t-slate-200 dark:border-t-slate-800 bg-sidebar shadow-none rounded-2xl transition-all">
      <div className="pt-2 pb-2 px-5">
        <div className="flex flex-col gap-0.5 mb-3">
          <Skeleton className="h-6 w-[140px] mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-xl" />
          ))}
          <div className="ml-auto">
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-border/50 flex justify-between items-center opacity-60">
          <Skeleton className="h-2 w-20" />
          <Skeleton className="h-2 w-12" />
        </div>
      </div>
    </Card>
  );
}
