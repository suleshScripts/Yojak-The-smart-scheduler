import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const holidays = await db.holiday.findMany({
      orderBy: {
        date: "asc"
      }
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Holidays fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, date, type, description } = body;

    const holiday = await db.holiday.create({
      data: {
        name,
        date: new Date(date),
        type,
        description: description || null
      }
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Holiday creation error:", error);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}