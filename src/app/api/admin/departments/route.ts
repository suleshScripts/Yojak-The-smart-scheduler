import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const departments = await db.department.findMany({
    select: { id: true, name: true, code: true }
  });
  return NextResponse.json({ departments });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, code, description } = await request.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // Generate a code if not provided
  const base = (code || name)
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || `DEPT${Math.floor(Math.random()*1000)}`;

  // Ensure uniqueness by appending a counter if needed
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
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, name } = await request.json();
  if (!id || !name) return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  const dept = await db.department.update({ where: { id }, data: { name } });
  return NextResponse.json({ department: dept });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await db.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


