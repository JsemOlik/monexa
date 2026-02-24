"use client";

import * as React from "react";
import {
  IconArrowsExchange,
  IconBuilding,
  IconCamera,
  IconChartBar,
  IconChevronDown,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSelector,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavAdmin } from "@/components/nav-admin";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useOrganization, OrganizationList, useUser, useClerk } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Surveys",
      url: "/surveys",
      icon: IconChartBar,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    }
  ],
  admin: [
    {
      name: "Manage Computers",
      url: "#",
      icon: IconDatabase,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { organization, membership } = useOrganization();
  const { user } = useUser();
  const { openOrganizationProfile } = useClerk();
  const [open, setOpen] = React.useState(false);

  const orgName = organization?.name || "Personal Workspace";
  const orgImageUrl = organization?.imageUrl || user?.imageUrl;
  
  const role = membership?.role 
    ? membership.role.split(":")[1]?.charAt(0).toUpperCase() + membership.role.split(":")[1]?.slice(1)
    : "Member";

  // Auto-close modal when organization changes
  React.useEffect(() => {
    setOpen(false);
  }, [organization?.id]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={orgImageUrl} alt={orgName} />
                      <AvatarFallback className="rounded-lg bg-emerald-500/20 text-emerald-500">
                        {orgName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{orgName}</span>
                    <span className="truncate text-xs text-muted-foreground">{role}</span>
                  </div>
                  <IconSelector className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Organizations
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpen(true)}>
                  <IconArrowsExchange className="size-4" />
                  Switch organization
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openOrganizationProfile()}>
                  <IconBuilding className="size-4" />
                  Manage organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Switch Organization Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent 
                showCloseButton={false}
                className="flex max-w-2xl flex-col items-center justify-center border-none bg-transparent p-0 shadow-none outline-none"
              >
                <DialogTitle className="sr-only">Select Organization</DialogTitle>
                <DialogDescription className="sr-only">
                  Choose an organization to switch workspaces.
                </DialogDescription>
                <OrganizationList 
                  hidePersonal={false} 
                  afterSelectOrganizationUrl="/dashboard"
                  afterCreateOrganizationUrl="/dashboard"
                  
                  appearance={{
                    elements: {
                      rootBox: "flex items-center justify-center w-full",
                      card: "shadow-xl border border-zinc-800 bg-zinc-950",
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAdmin items={data.admin} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
