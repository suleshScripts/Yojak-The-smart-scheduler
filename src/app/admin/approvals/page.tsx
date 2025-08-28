"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PendingUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  verificationStatus: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    load();
  }, [session, status, router]);

  const load = async () => {
    const res = await fetch("/api/admin/approvals");
    if (res.ok) {
      const data = await res.json();
      setPending(data.pending);
    }
  };

  const approve = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: roleMap[userId] || "STUDENT" })
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <p>No pending users.</p>
            ) : (
              pending.map((u) => (
                <div key={u.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{u.name || u.email}</div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      onValueChange={(val) => setRoleMap((m) => ({ ...m, [u.id]: val }))}
                      defaultValue={u.role}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">STUDENT</SelectItem>
                        <SelectItem value="FACULTY">FACULTY</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button disabled={loading} onClick={() => approve(u.id)}>Approve</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


