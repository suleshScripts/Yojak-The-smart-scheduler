"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  semester: number;
}

export default function SubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [departments, setDepartments] = useState<{id:string;name:string;code:string}[]>([]);
  const [form, setForm] = useState({ name: "", code: "", semester: "", departmentId: "" });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    load();
  }, [session, status, router]);

  const load = async () => {
    const [sRes, dRes] = await Promise.all([
      fetch("/api/admin/subjects"),
      fetch("/api/admin/departments"),
    ]);
    if (sRes.ok) setRows((await sRes.json()).subjects);
    if (dRes.ok) setDepartments((await dRes.json()).departments);
  };

  const createSubject = async () => {
    if (!form.name || !form.code || !form.semester || !form.departmentId) return;
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, semester: Number(form.semester) }),
    });
    if (res.ok) {
      setForm({ name: "", code: "", semester: "", departmentId: "" });
      await load();
    }
  };

  const deleteSubject = async (id: string) => {
    const res = await fetch(`/api/admin/subjects?id=${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input placeholder="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            <Select onValueChange={(v) => setForm({ ...form, departmentId: v })} value={form.departmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={createSubject}>Add</Button>
          </div>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p>No subjects found.</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-gray-600">{r.code} • Sem {r.semester}</div>
                  </div>
                  <Button variant="destructive" onClick={() => deleteSubject(r.id)}>Delete</Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


