import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function supa() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
}

async function getUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { data } = await supa().auth.getUser(token);
  return data.user;
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.user_metadata as any)?.role || "STUDENT";

  if (role === "ADMIN") {
    const rows = await db.syllabusProgress.findMany({
      include: {
        faculty: { include: { user: true, department: true } },
        subject: true,
      }
    });
    return NextResponse.json({ rows });
  }

  // FACULTY: only own subjects
  const prismaUser = await db.user.findUnique({ where: { email: user.email! } });
  if (!prismaUser) return NextResponse.json({ rows: [] });
  const faculty = await db.facultyProfile.findFirst({ where: { userId: prismaUser.id } });
  if (!faculty) return NextResponse.json({ rows: [] });

  const rows = await db.syllabusProgress.findMany({ where: { facultyId: faculty.id }, include: { subject: true } });
  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.user_metadata as any)?.role || "STUDENT";

  const body = await request.json();
  const { subjectId, coveredPercent, remarks } = body;
  if (!subjectId || coveredPercent === undefined) {
    return NextResponse.json({ error: "subjectId and coveredPercent are required" }, { status: 400 });
  }

  const prismaUser = await db.user.findUnique({ where: { email: user.email! } });
  if (!prismaUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let faculty = await db.facultyProfile.findFirst({ where: { userId: prismaUser.id } });
  if (role !== "ADMIN" && !faculty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Admin can set for any faculty via body.facultyId
  if (role === "ADMIN" && body.facultyId) {
    faculty = await db.facultyProfile.findUnique({ where: { id: body.facultyId } });
    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  const row = await db.syllabusProgress.upsert({
    where: { facultyId_subjectId: { facultyId: faculty!.id, subjectId } },
    update: { coveredPercent: Number(coveredPercent), remarks: remarks || null },
    create: { facultyId: faculty!.id, subjectId, coveredPercent: Number(coveredPercent), remarks: remarks || null },
  });

  return NextResponse.json({ row });
}
