"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ComputerCard } from "./computer-card";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";

export function ComputerGrid() {
  const computers = useQuery(api.computers.list);
  const rooms = useQuery(api.rooms.list);

  if (computers !== undefined && rooms !== undefined && rooms.length === 0) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-center">
          No rooms created.
          <br /> Head over to the{" "}
          <Link
            href="/dashboard/manage-computers"
            className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
          >
            management page
          </Link>{" "}
          to create some
        </p>
      </div>
    );
  }

  if (computers?.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">No computers found.</p>
      </div>
    );
  }

  // Create groupings
  const groupedComputers: Record<string, any[]> = {};
  const unassigned: any[] = [];

  if (computers) {
    computers.forEach((comp) => {
      if (comp.roomId && rooms?.find((r) => r._id === comp.roomId)) {
        if (!groupedComputers[comp.roomId]) groupedComputers[comp.roomId] = [];
        groupedComputers[comp.roomId].push(comp);
      } else {
        unassigned.push(comp);
      }
    });
  }

  return (
    <div className="flex flex-col gap-10 @container">
      {/* Grouped Rooms */}
      {rooms?.map((room) => {
        const roomComputers = groupedComputers[room._id] || [];

        return (
          <div key={room._id} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-semibold tracking-tight">
                {room.name}
              </h2>
              <span className="text-muted-foreground text-xs font-medium ml-1">
                {roomComputers.length}{" "}
                {roomComputers.length === 1 ? "Device" : "Devices"}
              </span>
            </div>
            {roomComputers.length > 0 ? (
              <div className="grid gap-4 @xs:grid-cols-1 @xl:grid-cols-2 @6xl:grid-cols-3 @7xl:grid-cols-3">
                {roomComputers.map((item) => (
                  <ComputerCard key={item.id} computer={item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic ml-3">
                No assigned computers to this room
              </p>
            )}
          </div>
        );
      })}

      {/* Loading Skeletons */}
      {(computers === undefined || rooms === undefined) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid gap-4 @xs:grid-cols-1 @xl:grid-cols-2 @6xl:grid-cols-3 @7xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ComputerSkeleton key={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ComputerSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/10 border-t-[6px] border-t-slate-200 dark:border-t-slate-800 bg-sidebar shadow-none rounded-2xl transition-all">
      <div className="px-5 pt-4 pb-4">
        <div className="flex flex-col gap-1 mb-5">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-[140px]" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-[0.8rem] font-medium text-muted-foreground/90">
              <Skeleton className="h-3 w-14" />
              <span className="text-muted-foreground/40">•</span>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-t border-border/40 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-xl" />
          ))}
          <div className="ml-auto">
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>
      </div>
    </Card>
  );
}
