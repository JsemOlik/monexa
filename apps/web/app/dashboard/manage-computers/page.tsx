"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconPlus, IconTrash, IconDevices } from "@tabler/icons-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ComputerCard } from "@/components/computer-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

function DraggableComputer({ computer }: { computer: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: computer._id,
    data: { computer },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      id={computer._id}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <ComputerCard computer={computer} isManagement className="w-full" />
    </div>
  );
}

export default function ManageComputersPage() {
  const rooms = useQuery(api.rooms.list);
  const computers = useQuery(api.computers.list);
  const createRoom = useMutation(api.rooms.create);
  const removeRoom = useMutation(api.rooms.remove);
  const assignToRoom = useMutation(api.computers.assignToRoom);

  const [newRoomName, setNewRoomName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeWidth, setActiveWidth] = React.useState<number | null>(null);
  const [expandedRooms, setExpandedRooms] = React.useState<Set<string>>(
    new Set(),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  React.useEffect(() => {
    if (rooms && expandedRooms.size === 0) {
      setExpandedRooms(new Set([...rooms.map((r) => r._id), "unassigned"]));
    }
  }, [rooms]);

  const toggleRoom = (id: string) => {
    const next = new Set(expandedRooms);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRooms(next);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setIsSubmitting(true);
    try {
      await createRoom({ name: newRoomName.trim() });
      setNewRoomName("");
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRoom = async (id: any) => {
    try {
      await removeRoom({ id });
    } catch (error) {
      console.error("Failed to remove room:", error);
    }
  };

  const onDragStart = (event: any) => {
    setActiveId(event.active.id);
    const element = document.getElementById(event.active.id);
    if (element) {
      setActiveWidth(element.offsetWidth);
    }
  };

  const onDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;
  };

  const onDragEnd = async (event: any) => {
    setActiveId(null);
    setActiveWidth(null);
    const { active, over } = event;
    if (!over) return;

    const computerId = active.id;
    const overId = over.id;

    // Check if dropped over a room or a computer in a room
    let targetRoomId: string | undefined = undefined;

    if (over.data.current?.type === "room") {
      targetRoomId = overId === "unassigned" ? undefined : overId;
    } else if (over.data.current?.computer) {
      targetRoomId = over.data.current.computer.roomId;
    }

    const computer = computers?.find((c) => c._id === computerId);
    if (computer && computer.roomId !== targetRoomId) {
      try {
        await assignToRoom({
          computerId,
          roomId: targetRoomId as any,
        });
      } catch (error) {
        console.error("Failed to reassign computer:", error);
      }
    }
  };

  const groupedComputers = React.useMemo(() => {
    const groups: Record<string, any[]> = { unassigned: [] };
    if (rooms) rooms.forEach((r) => (groups[r._id] = []));
    if (computers) {
      computers.forEach((c) => {
        if (c.roomId && groups[c.roomId]) groups[c.roomId].push(c);
        else groups.unassigned.push(c);
      });
    }
    return groups;
  }, [rooms, computers]);

  const activeComputer = activeId
    ? computers?.find((c) => c._id === activeId)
    : null;

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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-hidden">
          <div className="flex flex-col gap-6 max-h-full">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold">Computer Management</h1>
                <p className="text-muted-foreground text-sm">
                  Organize your devices by dragging them between rooms.
                </p>
              </div>
              <form
                onSubmit={handleCreateRoom}
                className="flex gap-2 items-center"
              >
                <Input
                  placeholder="New room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-48 h-9"
                />
                <Button
                  size="sm"
                  type="submit"
                  disabled={isSubmitting || !newRoomName.trim()}
                >
                  <IconPlus className="size-4 mr-2" />
                  Create Room
                </Button>
              </form>
            </div>

            <Separator />

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
              {rooms === undefined || computers === undefined ? (
                <div className="grid gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                      </div>
                      <div className="grid gap-4 p-4 rounded-2xl border border-dashed border-border/60 bg-muted/5 @xs:grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
                        {[1, 2, 3, 4].map((j) => (
                          <Skeleton
                            key={j}
                            className="h-32 w-full rounded-2xl"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragEnd={onDragEnd}
                >
                  <div className="grid gap-6">
                    {/* Render rooms */}
                    {rooms?.map((room) => (
                      <RoomSection
                        key={room._id}
                        room={room}
                        computers={groupedComputers[room._id] || []}
                        isExpanded={expandedRooms.has(room._id)}
                        onToggle={() => toggleRoom(room._id)}
                        onDelete={() => handleRemoveRoom(room._id)}
                      />
                    ))}

                    {/* Unassigned section */}
                    <RoomSection
                      room={
                        { _id: "unassigned", name: "Unassigned Devices" } as any
                      }
                      computers={groupedComputers.unassigned}
                      isExpanded={expandedRooms.has("unassigned")}
                      onToggle={() => toggleRoom("unassigned")}
                      isUnassigned
                    />
                  </div>

                  <DragOverlay dropAnimation={null}>
                    {activeId && activeComputer ? (
                      <div
                        className="pointer-events-none"
                        style={{
                          width: activeWidth ? `${activeWidth}px` : "auto",
                        }}
                      >
                        <ComputerCard
                          computer={activeComputer}
                          isManagement
                          className="shadow-2xl scale-105"
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function RoomSection({
  room,
  computers,
  isExpanded,
  onToggle,
  onDelete,
  isUnassigned,
}: {
  room: any;
  computers: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  isUnassigned?: boolean;
}) {
  const { setNodeRef } = useSortable({
    id: room._id,
    data: { type: "room" },
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center group cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 flex-1">
          {isExpanded ? (
            <IconChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <IconChevronRight className="size-4 text-muted-foreground" />
          )}
          <h2 className="text-lg font-semibold tracking-tight">{room.name}</h2>
          <Badge
            variant="secondary"
            className="text-[10px] h-5 px-1.5 font-bold"
          >
            {computers.length}
          </Badge>
          {!isUnassigned && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconTrash className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                    <IconTrash />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{room.name}"? All computers
                    in this room will become unassigned. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                  >
                    Delete Room
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "grid gap-4 min-h-0 overflow-hidden p-4 rounded-2xl border border-dashed transition-colors",
            "@xs:grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4",
            computers.length === 0
              ? "border-border/60 bg-muted/5"
              : "border-transparent bg-transparent",
          )}
        >
          <div className="min-h-0">
            {computers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <IconDevices className="size-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground italic">
                  Drag devices here to assign to this room.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 @xs:grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
                <SortableContext
                  items={computers.map((c) => c._id)}
                  strategy={rectSortingStrategy}
                >
                  {computers.map((c) => (
                    <DraggableComputer key={c._id} computer={c} />
                  ))}
                </SortableContext>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
