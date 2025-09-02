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

  const facultyUsers = await db.user.findMany({
    where: { role: "FACULTY" },
    select: { id: true, email: true, name: true }
  });

  return NextResponse.json({ faculty: facultyUsers });
}

export async function POST(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, name, departmentId } = await request.json();
  if (!email || !departmentId) return NextResponse.json({ error: "email and departmentId are required" }, { status: 400 });

  const user = await db.user.upsert({
    where: { email },
    update: { role: "FACULTY", verificationStatus: "APPROVED", name },
    create: { email, name, role: "FACULTY", verificationStatus: "APPROVED" }
  });

  await db.facultyProfile.upsert({
    where: { userId: user.id },
    update: { departmentId },
    create: { userId: user.id, departmentId }
  });

  return NextResponse.json({ userId: user.id });
}


