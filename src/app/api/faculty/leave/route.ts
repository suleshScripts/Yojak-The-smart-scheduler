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
        facultyId: faculty.id,
        status: "LEAVE"
      },
      orderBy: {
        date: "desc"
      }
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Faculty leave fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, reason } = body;

    const faculty = await db.facultyProfile.findFirst({
      where: { userId: session.user.id }
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });
    }

    // Check if attendance record already exists
    const existingAttendance = await db.attendance.findUnique({
      where: {
        facultyId_date: {
          facultyId: faculty.id,
          date: new Date(date)
        }
      }
    });

    if (existingAttendance) {
      // Update existing record
      const attendance = await db.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: "LEAVE",
          notes: reason
        }
      });

      return NextResponse.json(attendance);
    } else {
      // Create new attendance record
      const attendance = await db.attendance.create({
        data: {
          facultyId: faculty.id,
          date: new Date(date),
          status: "LEAVE",
          notes: reason
        }
      });

      return NextResponse.json(attendance);
    }
  } catch (error) {
    console.error("Faculty leave creation error:", error);
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}