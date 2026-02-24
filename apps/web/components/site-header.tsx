import { useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Copy, Hash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const ensureOrg = useMutation(api.computers.ensureOrg);
  
  const orgId = organization?.id || user?.id;

  useEffect(() => {
    if (orgId) {
      ensureOrg();
    }
  }, [user, organization, orgId, ensureOrg]);

  const copyOrgId = () => {
    if (orgId) {
      navigator.clipboard.writeText(orgId);
    }
  };

  return (
    <header className="mb-4 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard</h1>
        <div className="ml-auto flex items-center gap-4">
          {orgId && (
            <div 
              onClick={copyOrgId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer transition-all"
              title="Click to copy Organization ID"
            >
              <Hash className="h-3 w-3" />
              <span>Org: {orgId.substring(0, 12)}...</span>
              <Copy className="h-3 w-3 ml-1" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
