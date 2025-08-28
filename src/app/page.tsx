"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("Session status:", status, "Session:", session);

    if (status === "loading") return; // Wait until loading is done

    if (!session) {
      console.log("➡️ No session found, redirecting to /auth/signin");
      router.replace("/auth/signin"); // use replace() to avoid back button loop
    } else {
      console.log("✅ Session found, redirecting to /dashboard");
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Checking session...</span>
      </div>
    );
  }

  // Fallback UI while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2 text-lg">Redirecting...</span>
    </div>
  );
}
