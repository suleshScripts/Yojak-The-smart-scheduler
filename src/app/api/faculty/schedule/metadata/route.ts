import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "FACULTY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'subjects') {
    const faculty = await db.facultyProfile.findFirst({ where: { userId: session.user.id }, include: { subjects: true } });
    const subjectIds = (faculty?.subjects || []).map(s => s.subjectId);
    const subjects = await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } });
    return NextResponse.json({ subjects });
  }

  if (type === 'classrooms') {
    const classrooms = await db.classroom.findMany({ select: { id: true, name: true } });
    return NextResponse.json({ classrooms });
  }

  return NextResponse.json({ error: 'invalid type' }, { status: 400 });
}


