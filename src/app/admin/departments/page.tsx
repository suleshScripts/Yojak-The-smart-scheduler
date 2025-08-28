"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Dept { id: string; name: string; code: string }

export default function DepartmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Dept[]>([]);
  const [form, setForm] = useState({ name: "" });
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    load();
  }, [session, status, router]);

  const load = async () => {
    const res = await fetch("/api/admin/departments");
    if (res.ok) setRows((await res.json()).departments);
  };

  const create = async () => {
    if (!form.name) return;
    const res = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ name: "" });
      await load();
    }
  };

  const update = async () => {
    if (!edit) return;
    const res = await fetch("/api/admin/departments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: edit.id, name: edit.name })
    });
    if (res.ok) {
      setEdit(null);
      await load();
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/departments?id=${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
            <Button onClick={create}>Add</Button>
          </div>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p>No departments found.</p>
            ) : (
              rows.map(d => (
                <div key={d.id} className="flex items-center justify-between border rounded p-3 gap-3">
                  {edit?.id === d.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input value={edit.name} onChange={(e)=>setEdit({ ...edit, name: e.target.value })} />
                      <Button onClick={update}>Save</Button>
                      <Button variant="ghost" onClick={()=>setEdit(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-sm text-gray-600">{d.code}</div>
                    </div>
                  )}
                  {edit?.id !== d.id && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={()=>setEdit({ id: d.id, name: d.name })}>Edit</Button>
                      <Button variant="destructive" onClick={()=>remove(d.id)}>Delete</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


