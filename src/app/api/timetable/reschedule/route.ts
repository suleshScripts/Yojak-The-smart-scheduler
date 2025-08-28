import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RescheduleRequest {
  emergencyDate: string; // ISO date string
  reason: string;
  rescheduleType: "SHIFT_REMAINING" | "CANCEL_ALL";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RescheduleRequest = await request.json();
    const { emergencyDate, reason, rescheduleType } = body;

    // Create emergency holiday
    const holiday = await db.holiday.create({
      data: {
        name: `Emergency Holiday - ${reason}`,
        date: new Date(emergencyDate),
        type: "EMERGENCY",
        description: reason
      }
    });

    // Get affected timetable entries
    const emergencyDay = new Date(emergencyDate);
    const dayOfWeek = emergencyDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Convert to our day format (1 = Monday, 5 = Friday)
    const ourDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek;

    const affectedEntries = await db.timetableEntry.findMany({
      where: {
        dayOfWeek: ourDayOfWeek
      },
      include: {
        subject: true,
        faculty: {
          include: {
            user: true
          }
        },
        classroom: true
      }
    });

    if (rescheduleType === "SHIFT_REMAINING") {
      // Reschedule affected classes to remaining days of the week
      const remainingDays = [1, 2, 3, 4, 5].filter(day => day !== ourDayOfWeek);
      
      for (const entry of affectedEntries) {
        const rescheduled = await rescheduleClass(entry, remainingDays);
        
        if (rescheduled) {
          // Mark original entry as rescheduled
          await db.timetableEntry.update({
            where: { id: entry.id },
            data: {
              isRescheduled: true
            }
          });
        }
      }
    }

    // Send notifications (this would integrate with n8n in production)
    await sendNotifications(affectedEntries, emergencyDate, reason, rescheduleType);

    return NextResponse.json({ 
      success: true, 
      message: "Emergency rescheduling completed",
      affectedEntries: affectedEntries.length,
      holiday 
    });
  } catch (error) {
    console.error("Emergency rescheduling error:", error);
    return NextResponse.json({ 
      error: "Failed to process emergency rescheduling",
      details: error.message 
    }, { status: 500 });
  }
}

async function rescheduleClass(entry: any, remainingDays: number[]) {
  // Try to find available slots in remaining days
  const timeSlots = [
    { start: 9, end: 10 },
    { start: 10, end: 11 },
    { start: 11, end: 12 },
    { start: 13, end: 14 },
    { start: 14, end: 15 },
    { start: 15, end: 16 },
    { start: 16, end: 17 }
  ];

  // Check existing timetable for conflicts
  const existingEntries = await db.timetableEntry.findMany({
    where: {
      dayOfWeek: { in: remainingDays },
      OR: [
        { facultyId: entry.facultyId },
        { classroomId: entry.classroomId }
      ]
    }
  });

  // Find available slot
  for (const day of remainingDays) {
    for (const timeSlot of timeSlots) {
      const startTime = new Date();
      startTime.setHours(timeSlot.start, 0, 0, 0);
      
      const endTime = new Date();
      endTime.setHours(timeSlot.end, 0, 0, 0);

      // Check for conflicts
      const hasConflict = existingEntries.some(existing => {
        if (existing.dayOfWeek !== day) return false;
        
        const existingStart = new Date(existing.startTime);
        const existingEnd = new Date(existing.endTime);
        
        return (startTime < existingEnd && endTime > existingStart);
      });

      if (!hasConflict) {
        // Create rescheduled entry
        await db.timetableEntry.create({
          data: {
            subjectId: entry.subjectId,
            facultyId: entry.facultyId,
            classroomId: entry.classroomId,
            dayOfWeek: day,
            startTime,
            endTime,
            classType: entry.classType,
            isRescheduled: true,
            originalId: entry.id,
            createdById: entry.createdById
          }
        });

        return true;
      }
    }
  }

  return false;
}

async function sendNotifications(affectedEntries: any[], emergencyDate: string, reason: string, rescheduleType: string) {
  // In production, this would integrate with n8n for email/SMS notifications
  // For now, we'll just log the notifications
  
  console.log(`Emergency Rescheduling Notification:`);
  console.log(`Date: ${emergencyDate}`);
  console.log(`Reason: ${reason}`);
  console.log(`Type: ${rescheduleType}`);
  console.log(`Affected Classes: ${affectedEntries.length}`);
  
  // Group by faculty
  const facultyNotifications = new Map();
  
  affectedEntries.forEach(entry => {
    if (!facultyNotifications.has(entry.facultyId)) {
      facultyNotifications.set(entry.facultyId, {
        faculty: entry.faculty.user.name,
        subjects: []
      });
    }
    
    facultyNotifications.get(entry.facultyId).subjects.push({
      subject: entry.subject.name,
      time: `${entry.startTime.toLocaleTimeString()} - ${entry.endTime.toLocaleTimeString()}`,
      classroom: entry.classroom.name
    });
  });

  // Log faculty notifications
  facultyNotifications.forEach((notification, facultyId) => {
    console.log(`\nNotification for Faculty: ${notification.faculty}`);
    notification.subjects.forEach((subject: any) => {
      console.log(`  - ${subject.subject} at ${subject.time} in ${subject.classroom}`);
    });
  });

  // In production, this would send real notifications via n8n
  // Example: await n8n.trigger('emergency-reschedule', { ...data });
}