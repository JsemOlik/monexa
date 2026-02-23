"use client";

import { useEffect, useState } from "react";
import { Power, RotateCcw, Shield, Radar, Pencil, Unplug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ComputerCardProps {
  computer: {
    id: string;
    name: string;
    os: string;
    status: "online" | "offline";
    lastSeen: number;
  };
}

export function ComputerCard({ computer }: ComputerCardProps) {
  const [lastSeenText, setLastSeenText] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const diff = Math.floor((Date.now() - computer.lastSeen) / 1000);
      if (diff < 60) {
        setLastSeenText(`${diff} seconds`);
      } else {
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        setLastSeenText(`${m} m ${s} s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [computer.lastSeen]);

  return (
    <Card
      className={cn(
        "overflow-hidden border border-border/10 border-t-[6px] bg-[#1c1c1c] dark:bg-sidebar shadow-none transition-all rounded-2xl flex flex-col",
        computer.status === "online"
          ? "border-t-[#10a37f]"
          : "border-t-red-500",
      )}
    >
      <div className="px-5">
        <div className="flex flex-col gap-0.5 mb-4">
          <h3 className="text-xl font-bold tracking-tight text-white dark:text-foreground truncate leading-tight">
            {computer.name}
          </h3>
          <p className="text-sm text-muted-foreground/80 font-medium">
            {computer.status === "online" ? "Zapnuto" : "Vypnuto"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <ActionButton icon={Power} />
          <ActionButton icon={RotateCcw} />
          <ActionButton icon={Shield} />
          <ActionButton icon={Radar} />
          <ActionButton icon={Pencil} />
          <div className="ml-auto">
            <ActionButton icon={Unplug} variant="danger" />
          </div>
        </div>

        <div className="mt-3 flex justify-between items-center opacity-60">
          <p className="text-[0.7rem] text-muted-foreground uppercase font-bold tracking-wider">
            {lastSeenText}
          </p>
          <p className="text-[0.7rem] text-muted-foreground uppercase font-bold tracking-wider">
            {computer.os}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ActionButton({
  icon: Icon,
  variant = "default",
}: {
  icon: any;
  variant?: "default" | "danger";
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 bg-[#2c2c2e] hover:bg-[#3a3a3c] dark:bg-sidebar-accent/50 dark:hover:bg-sidebar-accent text-white dark:text-sidebar-accent-foreground rounded-xl transition-colors shadow-none shrink-0",
        variant === "danger" &&
          "bg-destructive/10 hover:bg-destructive/20 text-destructive shadow-none",
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
