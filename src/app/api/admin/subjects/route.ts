import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subjects = await db.subject.findMany({
    select: { id: true, name: true, code: true, semester: true, departmentId: true }
  });

  return NextResponse.json({ subjects });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await db.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


