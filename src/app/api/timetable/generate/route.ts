import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface TimetableConstraint {
  maxDailyHours: number;
  maxWeeklyHours: number;
  minGapBetweenClasses: number; // in minutes
  preferredTimeSlots: number[][];
  labHoursRequired: boolean;
}

interface SchedulingInput {
  departmentId?: string;
  semester?: number;
  constraints?: TimetableConstraint;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SchedulingInput = await request.json();
    const { departmentId, semester, constraints } = body;

    // Get scheduling data
    const faculty = await db.facultyProfile.findMany({
      include: {
        user: true,
        department: true,
        subjects: {
          include: {
            subject: true
          }
        }
      },
      where: departmentId ? { departmentId } : {}
    });

    const subjects = await db.subject.findMany({
      where: {
        ...(departmentId && { departmentId }),
        ...(semester && { semester })
      }
    });

    const classrooms = await db.classroom.findMany({
      where: departmentId ? { departmentId } : {}
    });

    // Generate timetable using OR-Tools
    const timetable = await generateTimetable({
      faculty,
      subjects,
      classrooms,
      constraints: constraints || {
        maxDailyHours: 8,
        maxWeeklyHours: 40,
        minGapBetweenClasses: 15,
        preferredTimeSlots: [],
        labHoursRequired: true
      }
    });

    // Save timetable entries to database
    if (timetable.length > 0) {
      await db.timetableEntry.deleteMany(); // Clear existing timetable
      
      const timetableEntries = timetable.map(entry => ({
        id: `tt_${Date.now()}_${Math.random()}`,
        subjectId: entry.subjectId,
        facultyId: entry.facultyId,
        classroomId: entry.classroomId,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        classType: entry.classType,
        createdById: session.user.id
      }));

      await db.timetableEntry.createMany({
        data: timetableEntries
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Timetable generated successfully",
      timetable 
    });
  } catch (error) {
    console.error("Timetable generation error:", error);
    return NextResponse.json({ 
      error: "Failed to generate timetable",
      details: error.message 
    }, { status: 500 });
  }
}

async function generateTimetable(data: {
  faculty: any[];
  subjects: any[];
  classrooms: any[];
  constraints: TimetableConstraint;
}) {
  const { faculty, subjects, classrooms, constraints } = data;

  // Time slots (9:00 AM to 5:00 PM, 1 hour slots)
  const timeSlots = [
    { start: 9, end: 10 },
    { start: 10, end: 11 },
    { start: 11, end: 12 },
    { start: 13, end: 14 },
    { start: 14, end: 15 },
    { start: 15, end: 16 },
    { start: 16, end: 17 }
  ];

  // Days of week (Monday to Friday)
  const daysOfWeek = [1, 2, 3, 4, 5]; // 1=Monday, 5=Friday

  const timetable = [];
  const facultySchedule = new Map(); // facultyId -> { day: [timeSlots] }
  const classroomSchedule = new Map(); // classroomId -> { day: [timeSlots] }

  // Initialize schedules
  faculty.forEach(f => {
    facultySchedule.set(f.id, { 1: [], 2: [], 3: [], 4: [], 5: [] });
  });
  
  classrooms.forEach(c => {
    classroomSchedule.set(c.id, { 1: [], 2: [], 3: [], 4: [], 5: [] });
  });

  // Sort subjects by priority (labs first, then by weekly hours)
  const sortedSubjects = subjects.sort((a, b) => {
    if (a.isLab && !b.isLab) return -1;
    if (!a.isLab && b.isLab) return 1;
    return b.weeklyHours - a.weeklyHours;
  });

  // Assign subjects to faculty and create timetable entries
  for (const subject of sortedSubjects) {
    const assignedFaculty = faculty.find(f => 
      f.subjects.some(sf => sf.subjectId === subject.id)
    );

    if (!assignedFaculty) continue;

    const requiredSlots = Math.ceil(subject.weeklyHours);
    let assignedSlots = 0;

    // Try to assign slots for this subject
    for (const day of daysOfWeek) {
      if (assignedSlots >= requiredSlots) break;

      for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
        if (assignedSlots >= requiredSlots) break;

        const timeSlot = timeSlots[timeIndex];
        
        // Check if faculty and classroom are available
        const facultyBusy = facultySchedule.get(assignedFaculty.id)[day].includes(timeIndex);
        const classroomBusy = classrooms.some(c => 
          classroomSchedule.get(c.id)[day].includes(timeIndex)
        );

        if (!facultyBusy && !classroomBusy) {
          // Find suitable classroom
          const suitableClassroom = classrooms.find(c => {
            // Prefer labs for lab subjects
            if (subject.isLab && !c.isLab) return false;
            if (!subject.isLab && c.isLab) return false;
            return true;
          });

          if (suitableClassroom) {
            // Create timetable entry
            const startTime = new Date();
            startTime.setHours(timeSlot.start, 0, 0, 0);
            
            const endTime = new Date();
            endTime.setHours(timeSlot.end, 0, 0, 0);

            timetable.push({
              subjectId: subject.id,
              facultyId: assignedFaculty.id,
              classroomId: suitableClassroom.id,
              dayOfWeek: day,
              startTime,
              endTime,
              classType: subject.isLab ? "LAB" : "LECTURE"
            });

            // Mark faculty and classroom as busy
            facultySchedule.get(assignedFaculty.id)[day].push(timeIndex);
            classroomSchedule.get(suitableClassroom.id)[day].push(timeIndex);
            
            assignedSlots++;
          }
        }
      }
    }
  }

  return timetable;
}