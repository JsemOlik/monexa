"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ComputerCard } from "./computer-card";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { CenteredLoading } from "./centered-loading";

export function ComputerGrid() {
  const computers = useQuery(api.computers.list);
  const [cachedCount, setCachedCount] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("monexa_computer_count");
    if (saved) setCachedCount(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (computers) {
      localStorage.setItem(
        "monexa_computer_count",
        computers.length.toString(),
      );
    }
  }, [computers]);

  if (computers === undefined && cachedCount === null) {
    return <CenteredLoading />;
  }

  if (computers?.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">No computers found.</p>
      </div>
    );
  }

  // Use either the actual fetched computers or fake ones for the skeleton based on cached count
  const renderItems = computers || Array.from({ length: cachedCount || 3 });

  return (
    <div className="@container">
      <div className="grid gap-4 @xs:grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 @7xl:grid-cols-5">
        {renderItems.map((item, index) =>
          computers ? (
            <ComputerCard key={(item as any).id} computer={item as any} />
          ) : (
            <ComputerSkeleton key={index} />
          ),
        )}
      </div>
    </div>
  );
}

export function ComputerSkeleton() {
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
