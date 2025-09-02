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
  if (!token) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const role = (data.user.user_metadata as any)?.role;
  return role === "ADMIN" ? data.user : null;
}

export async function GET(request: Request) {
  const adminUser = await requireAdmin(request);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pending = await db.user.findMany({
    where: { verificationStatus: "PENDING" },
    select: { id: true, email: true, name: true, role: true, verificationStatus: true, createdAt: true }
  });

  return NextResponse.json({ pending });
}

export async function POST(request: Request) {
  const adminUser = await requireAdmin(request);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, role = "STUDENT" } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const user = await db.user.update({
    where: { id: userId },
    data: { verificationStatus: "APPROVED", role }
  });

  return NextResponse.json({ user });
}


