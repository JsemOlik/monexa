import { useEffect, useState, forwardRef } from "react";
import { Power, RotateCcw, Shield, Radar, Pencil, Unplug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const [newName, setNewName] = useState(computer.name);
  const [isOpen, setIsOpen] = useState(false);
  const renameComputer = useMutation(api.computers.rename);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      await renameComputer({ id: computer.id, newName: newName.trim() });
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const diff = Math.floor((Date.now() - computer.lastSeen) / 1000);

      if (diff < 60) {
        setLastSeenText(`${diff} s`);
      } else if (diff < 3600) {
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        setLastSeenText(`${m} m ${s} s`);
      } else if (diff < 86400) {
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        setLastSeenText(`${h} h ${m} m`);
      } else if (diff < 604800) {
        const d = Math.floor(diff / 86400);
        const h = Math.floor((diff % 86400) / 3600);
        setLastSeenText(`${d} d ${h} h`);
      } else {
        const w = Math.floor(diff / 604800);
        const d = Math.floor((diff % 604800) / 86400);
        setLastSeenText(`${w} w ${d} d`);
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
      <div className="px-5 ">
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold tracking-tight text-white dark:text-foreground truncate leading-tight">
              {computer.name}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-[0.8rem] font-medium text-muted-foreground/90">
              <span
                className={
                  computer.status === "online"
                    ? "text-[#10a37f]"
                    : "text-red-500/90"
                }
              >
                {computer.status === "online" ? "Zapnuto" : "Vypnuto"}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span>{lastSeenText}</span>
            </div>
            <span className="text-[0.65rem] text-muted-foreground uppercase font-bold tracking-wider opacity-70">
              {computer.os}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ActionButton icon={Power} />
          <ActionButton icon={RotateCcw} />
          <ActionButton icon={Shield} />
          <ActionButton icon={Radar} />

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <ActionButton icon={Pencil} />
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#1c1c1c] border-border/10 text-white rounded-2xl">
              <DialogHeader>
                <DialogTitle>Rename Computer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRename}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-muted-foreground">
                      Hostname
                    </Label>
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-[#2c2c2e] border-border/10 text-white focus-visible:ring-[#10a37f]"
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#10a37f] hover:bg-[#0e8c6d] text-white"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="ml-auto">
            <ActionButton icon={Unplug} variant="danger" />
          </div>
        </div>
      </div>
    </Card>
  );
}

const ActionButton = forwardRef<
  HTMLButtonElement,
  {
    icon: any;
    variant?: "default" | "danger";
    [key: string]: any;
  }
>(({ icon: Icon, variant = "default", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 bg-[#2c2c2e] hover:bg-[#3a3a3c] dark:bg-sidebar-accent/50 dark:hover:bg-sidebar-accent text-white dark:text-sidebar-accent-foreground rounded-xl transition-colors shadow-none shrink-0",
        variant === "danger" &&
          "bg-destructive/10 hover:bg-destructive/20 text-destructive shadow-none",
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
});

ActionButton.displayName = "ActionButton";
