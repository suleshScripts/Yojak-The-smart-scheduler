"use client";

import { SupabaseAuthProvider } from "@/lib/supabase-auth";
import { Toaster } from "@/components/ui/toaster";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SupabaseAuthProvider>
      {children}
      <Toaster />
    </SupabaseAuthProvider>
  );
}