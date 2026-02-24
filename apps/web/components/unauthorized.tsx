"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { IconLock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function Unauthorized({
  message = "You don't have permission to access this feature.",
}: {
  message?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[400px]">
      <Card className="max-w-md w-full bg-sidebar border-white/5 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center pt-10 pb-2">
          <div className="mx-auto size-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <IconLock className="size-10 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-black text-white">
            Access Denied
          </CardTitle>
          <CardDescription className="text-zinc-400 mt-2 text-lg px-6">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-zinc-500 pb-6 px-10">
          If you believe this is an error, please contact your organization
          administrator to update your role and permissions.
        </CardContent>
        <CardFooter className="flex gap-3 px-8 pb-10">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-12 font-bold"
          >
            Go Back
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 font-bold"
          >
            Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
