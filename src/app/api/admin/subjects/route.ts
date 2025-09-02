import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return false;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return false;
  const role = (data.user.user_metadata as any)?.role;
  return role === "ADMIN";
}

export async function GET(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjects = await db.subject.findMany({
    select: { id: true, name: true, code: true, semester: true, departmentId: true }
  });

  return NextResponse.json({ subjects });
}

export async function POST(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, code, semester, departmentId, weeklyHours = 3, totalHours = 45, isLab = false } = await request.json();
  if (!name || !code || !semester || !departmentId) {
    return NextResponse.json({ error: "name, code, semester, departmentId are required" }, { status: 400 });
  }

  const subject = await db.subject.create({
    data: { name, code, semester: Number(semester), departmentId, weeklyHours: Number(weeklyHours), totalHours: Number(totalHours), isLab: Boolean(isLab) }
  });
  return NextResponse.json({ subject });
}

export async function DELETE(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await db.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


