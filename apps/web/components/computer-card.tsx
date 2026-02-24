import { useEffect, useState, forwardRef } from "react";
import {
  Shield,
  Pencil,
  Unplug,
  Circle,
  Trash2,
  ClipboardList,
} from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";

export const ComputerCard = forwardRef<
  HTMLDivElement,
  {
    computer: any;
    isManagement?: boolean;
  } & React.HTMLAttributes<HTMLDivElement>
>(({ computer, isManagement, className, ...props }, ref) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(computer.name);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const rename = useMutation(api.computers.rename);
  const toggleBlock = useMutation(api.computers.toggleBlock);
  const setOffline = useMutation(api.computers.setOffline);
  const wipe = useMutation(api.computers.wipe);

  // Update current time every 5 seconds to accurately reflect TTL status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const isOnline =
    computer.status === "online" && currentTime - computer.lastSeen < 20000;
  const isBlocked = !!computer.isBlocked;
  const isSurveying = !!computer.isSurveying;

  return (
    <Card
      ref={ref}
      className={cn(
        "overflow-hidden border border-border/10 border-t-[6px] bg-[#1c1c1c] dark:bg-sidebar shadow-none transition-all rounded-2xl flex flex-col",
        isSurveying
          ? "border-t-purple-500"
          : isBlocked
            ? "border-t-red-500"
            : isOnline
              ? "border-t-[#10a37f]"
              : "border-t-orange-500",
        className,
      )}
      {...props}
    >
      <div className="px-5">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold tracking-tight text-white dark:text-foreground truncate leading-tight">
              {computer.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                <Circle className="h-2 w-2 fill-emerald-500" />
                Zapnuto
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                <Circle className="h-2 w-2 fill-orange-500" />
                Vypnuto
              </div>
            )}
            {isSurveying && (
              <div className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 animate-pulse">
                <ClipboardList className="h-2.5 w-2.5" />
                Surveying
              </div>
            )}
            <div className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-500">
              {computer.os}
            </div>
          </div>
        </div>

        {!isManagement && (
          <div className="flex items-center gap-1.5 mt-4">
            <ActionButton
              icon={Shield}
              onClick={() => toggleBlock({ id: computer.id })}
              className={cn(
                isBlocked &&
                  "bg-red-500 text-white hover:bg-red-600 border-red-600",
              )}
              title={isBlocked ? "Odblokovat" : "Zablokovat"}
            />

            <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
              <DialogTrigger asChild>
                <ActionButton icon={Pencil} title="Přejmenovat" />
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Přejmenovat počítač</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Zadejte nový název pro toto zařízení.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border-white/10 bg-zinc-900 text-white"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsRenaming(false)}
                    className="border-white/10 bg-transparent text-white hover:bg-white/5"
                  >
                    Zrušit
                  </Button>
                  <Button
                    onClick={() => {
                      rename({ id: computer.id, newName });
                      setIsRenaming(false);
                    }}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Uložit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="ml-auto">
              {computer.status === "online" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <ActionButton
                      icon={Unplug}
                      variant="danger"
                      title="Odpojit"
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Odpojit počítač?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        Opravdu chcete odpojit počítač {computer.name}? Pokud je
                        aplikace na počítači spuštěna, bude spojení ihned
                        ukončeno.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">
                        Zrušit
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => setOffline({ id: computer.id })}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Odpojit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
        {isManagement && (
          <div className="flex items-center gap-1.5 mt-4">
            <div className="ml-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <ActionButton
                    icon={Trash2}
                    variant="danger"
                    title="Odstranit"
                    className="h-8 w-8 rounded-lg"
                  />
                </AlertDialogTrigger>
                <AlertDialogContent
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                      <Trash2 />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Odstranit počítač?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tímto trvale odstraníte počítač "{computer.name}" z
                      databáze. Tato akce je nevratná.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Zrušit</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => wipe({ id: computer._id })}
                    >
                      Odstranit
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

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
