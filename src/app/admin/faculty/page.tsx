"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/lib/supabase-auth";

interface FacultyRow {
  id: string;
  email: string;
  name: string | null;
}

export default function FacultyPage() {
  const { session, user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [rows, setRows] = useState<FacultyRow[]>([]);
  const [departments, setDepartments] = useState<{id:string;name:string;code:string}[]>([]);
  const [form, setForm] = useState({ email: "", name: "", departmentId: "" });

  useEffect(() => {
    if (loading) return;
    const role = (user?.user_metadata?.role as string) || "STUDENT";
    if (!session || role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    load();
  }, [session, loading, user, router]);

  const load = async () => {
    const [fRes, dRes] = await Promise.all([
      fetch("/api/admin/faculty", { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } }),
      fetch("/api/admin/departments", { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } }),
    ]);
    if (fRes.ok) setRows((await fRes.json()).faculty);
    if (dRes.ok) setDepartments((await dRes.json()).departments);
  };

  const createFaculty = async () => {
    if (!form.email || !form.departmentId) return;
    const res = await fetch("/api/admin/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ email: "", name: "", departmentId: "" });
      await load();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Faculty</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Faculty Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
            <Input placeholder="Name (optional)" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
            <Select onValueChange={(v)=>setForm({...form, departmentId:v})} value={form.departmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d=> (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={createFaculty}>Add</Button>
          </div>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p>No faculty found.</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{r.name || r.email}</div>
                    <div className="text-sm text-gray-600">{r.email}</div>
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
