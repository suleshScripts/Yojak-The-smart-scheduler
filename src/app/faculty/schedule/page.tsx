"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function FacultySchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<{id:string;name:string}[]>([]);
  const [classrooms, setClassrooms] = useState<{id:string;name:string}[]>([]);
  const [form, setForm] = useState({ subjectId: "", classroomId: "", dayOfWeek: "1", start: "09:00", end: "10:00" });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "FACULTY") {
      router.push("/auth/signin");
      return;
    }
    load();
  }, [session, status, router]);

  const load = async () => {
    const [sRes, cRes] = await Promise.all([
      fetch("/api/faculty/schedule/metadata?type=subjects"),
      fetch("/api/faculty/schedule/metadata?type=classrooms"),
    ]);
    if (sRes.ok) setSubjects((await sRes.json()).subjects);
    if (cRes.ok) setClassrooms((await cRes.json()).classrooms);
  };

  const create = async () => {
    const res = await fetch("/api/faculty/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) alert("Added");
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
            <Select value={form.subjectId} onValueChange={(v)=>setForm({...form, subjectId:v})}>
              <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s=> <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.classroomId} onValueChange={(v)=>setForm({...form, classroomId:v})}>
              <SelectTrigger><SelectValue placeholder="Classroom" /></SelectTrigger>
              <SelectContent>
                {classrooms.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.dayOfWeek} onValueChange={(v)=>setForm({...form, dayOfWeek:v})}>
              <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
              </SelectContent>
            </Select>
            <Input type="time" value={form.start} onChange={(e)=>setForm({...form, start:e.target.value})} />
            <Input type="time" value={form.end} onChange={(e)=>setForm({...form, end:e.target.value})} />
          </div>
          <Button onClick={create}>Add</Button>
        </CardContent>
      </Card>
    </div>
  );
}


