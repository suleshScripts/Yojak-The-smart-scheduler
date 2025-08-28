import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await db.user.findMany({
    where: { verificationStatus: "PENDING" },
    select: { id: true, email: true, name: true, role: true, verificationStatus: true, createdAt: true }
  });

  return NextResponse.json({ pending });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, role = "STUDENT" } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const user = await db.user.update({
    where: { id: userId },
    data: { verificationStatus: "APPROVED", role }
  });

  return NextResponse.json({ user });
}


