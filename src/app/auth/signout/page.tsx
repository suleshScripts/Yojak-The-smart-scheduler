"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">Sign out</h1>
        <Button onClick={() => signOut({ callbackUrl: "/auth/signin" })} size="lg">
          Sign out
        </Button>
      </div>
    </div>
  );
}


