import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const facultyUsers = await db.user.findMany({
    where: { role: "FACULTY" },
    select: { id: true, email: true, name: true }
  });

  return NextResponse.json({ faculty: facultyUsers });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, name, departmentId } = await request.json();
  if (!email || !departmentId) return NextResponse.json({ error: "email and departmentId are required" }, { status: 400 });

  // Ensure user exists and set role to FACULTY
  const user = await db.user.upsert({
    where: { email },
    update: { role: "FACULTY", verificationStatus: "APPROVED", name },
    create: { email, name, role: "FACULTY", verificationStatus: "APPROVED" }
  });

  // Ensure FacultyProfile exists
  await db.facultyProfile.upsert({
    where: { userId: user.id },
    update: { departmentId },
    create: { userId: user.id, departmentId }
  });

  return NextResponse.json({ userId: user.id });
}


