import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const faculty = await db.facultyProfile.findFirst({
      where: { userId: session.user.id }
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });
    }

    const attendance = await db.attendance.findMany({
      where: {
        facultyId: faculty.id
      },
      orderBy: {
        date: "desc"
      },
      take: 30 // Last 30 days
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Faculty attendance fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // "checkin" or "checkout"

    const faculty = await db.facultyProfile.findFirst({
      where: { userId: session.user.id }
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await db.attendance.findUnique({
      where: {
        facultyId_date: {
          facultyId: faculty.id,
          date: today
        }
      }
    });

    if (!attendance) {
      // Create new attendance record
      attendance = await db.attendance.create({
        data: {
          facultyId: faculty.id,
          date: today,
          status: "PRESENT"
        }
      });
    }

    if (action === "checkin") {
      if (attendance.checkIn) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
      }

      attendance = await db.attendance.update({
        where: { id: attendance.id },
        data: {
          checkIn: new Date()
        }
      });
    } else if (action === "checkout") {
      if (!attendance.checkIn) {
        return NextResponse.json({ error: "Please check in first" }, { status: 400 });
      }
      if (attendance.checkOut) {
        return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
      }

      attendance = await db.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: new Date()
        }
      });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Faculty attendance error:", error);
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 });
  }
}