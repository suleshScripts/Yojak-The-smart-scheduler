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

  const departments = await db.department.findMany({
    select: { id: true, name: true, code: true }
  });
  return NextResponse.json({ departments });
}

export async function POST(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, code, description } = await request.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const base = (code || name)
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || `DEPT${Math.floor(Math.random()*1000)}`;

  let uniqueCode = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (await db.department.findFirst({ where: { code: uniqueCode } })) {
    uniqueCode = `${base}${suffix}`.slice(0, 12);
    suffix++;
  }

  const dept = await db.department.create({
    data: { name, code: uniqueCode, description }
  });
  return NextResponse.json({ department: dept });
}

export async function PUT(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, name } = await request.json();
  if (!id || !name) return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  const dept = await db.department.update({ where: { id }, data: { name } });
  return NextResponse.json({ department: dept });
}

export async function DELETE(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await db.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


