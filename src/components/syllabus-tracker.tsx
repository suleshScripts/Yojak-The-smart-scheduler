"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSupabaseAuth } from "@/lib/supabase-auth";

interface Row {
  id: string;
  subject: { id: string; name: string };
  coveredPercent: number;
  remarks?: string | null;
  faculty?: { user: { name: string; email: string } };
}

export default function SyllabusTracker() {
  const { session, user } = useSupabaseAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ subjectId: "", coveredPercent: "", remarks: "" });

  useEffect(() => {
    if (!session) return;
    load();
    loadSubjects();
  }, [session]);

  const load = async () => {
    const res = await fetch("/api/syllabus", { headers: { Authorization: `Bearer ${session?.access_token}` } });
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows);
    }
  };

  const loadSubjects = async () => {
    const res = await fetch("/api/admin/subjects", { headers: { Authorization: `Bearer ${session?.access_token}` } });
    if (res.ok) {
      const data = await res.json();
      setSubjects(data.subjects);
    }
  };

  const submit = async () => {
    if (!form.subjectId || !form.coveredPercent) return;
    const res = await fetch("/api/syllabus", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ subjectId: form.subjectId, coveredPercent: Number(form.coveredPercent), remarks: form.remarks })
    });
    if (res.ok) {
      setForm({ subjectId: "", coveredPercent: "", remarks: "" });
      await load();
    }
  };

  const role = (user?.user_metadata as any)?.role || "STUDENT";

  return (
    <div className="space-y-6">
      {role === "FACULTY" && (
        <Card>
          <CardHeader>
            <CardTitle>Update Syllabus Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select className="border rounded px-3 py-2" value={form.subjectId} onChange={(e)=>setForm({...form, subjectId:e.target.value})}>
                <option value="">Select subject</option>
                {subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <Input placeholder="Covered %" value={form.coveredPercent} onChange={(e)=>setForm({...form, coveredPercent:e.target.value})} />
              <Input placeholder="Remarks (optional)" value={form.remarks} onChange={(e)=>setForm({...form, remarks:e.target.value})} />
              <Button onClick={submit}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Syllabus Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p>No records found.</p>
            ) : (
              rows.map(r => (
                <div key={r.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{r.subject.name}</div>
                    {r.faculty && (
                      <div className="text-sm text-gray-600">{r.faculty.user.name} • {r.faculty.user.email}</div>
                    )}
                  </div>
                  <Badge>{r.coveredPercent}%</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
