import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all faculty with their teaching hours
    const faculty = await db.facultyProfile.findMany({
      include: {
        user: true,
        department: true,
        timetableEntries: {
          include: {
            subject: true
          }
        }
      }
    });

    // Calculate NEP compliance for each faculty
    const complianceData = await Promise.all(
      faculty.map(async (f) => {
        // Calculate current week's teaching hours
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Get timetable entries for this week
        const weekEntries = f.timetableEntries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entryDate >= startOfWeek && entryDate <= endOfWeek;
        });

        // Calculate teaching hours
        let teachingHours = 0;
        let nonTeachingHours = 0;
        let studentInteractionHours = 0;

        weekEntries.forEach(entry => {
          const duration = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60); // hours
          teachingHours += duration;
          
          // Assume all teaching hours include student interaction
          studentInteractionHours += duration;
        });

        // NEP 2020 compliance rules
        const maxAllowedHours = 40; // Maximum weekly hours
        const minTeachingHours = 16; // Minimum teaching hours
        const minStudentInteractionHours = 8; // Minimum student interaction hours

        const totalHours = teachingHours + nonTeachingHours;
        const isCompliant = totalHours <= maxAllowedHours && 
                          teachingHours >= minTeachingHours && 
                          studentInteractionHours >= minStudentInteractionHours;

        // Create or update NEP compliance record
        const complianceRecord = await db.nEPCompliance.upsert({
          where: {
            facultyId_week: {
              facultyId: f.id,
              week: startOfWeek
            }
          },
          update: {
            teachingHours: Math.round(teachingHours * 100) / 100,
            nonTeachingHours: Math.round(nonTeachingHours * 100) / 100,
            studentInteractionHours: Math.round(studentInteractionHours * 100) / 100,
            totalHours: Math.round(totalHours * 100) / 100,
            maxAllowedHours,
            isCompliant
          },
          create: {
            facultyId: f.id,
            week: startOfWeek,
            teachingHours: Math.round(teachingHours * 100) / 100,
            nonTeachingHours: Math.round(nonTeachingHours * 100) / 100,
            studentInteractionHours: Math.round(studentInteractionHours * 100) / 100,
            totalHours: Math.round(totalHours * 100) / 100,
            maxAllowedHours,
            isCompliant
          }
        });

        return {
          faculty: {
            id: f.id,
            name: f.user.name,
            email: f.user.email,
            department: f.department.name
          },
          compliance: complianceRecord,
          weekEntries: weekEntries.length
        };
      })
    );

    // Summary statistics
    const totalFaculty = complianceData.length;
    const compliantFaculty = complianceData.filter(d => d.compliance.isCompliant).length;
    const nonCompliantFaculty = totalFaculty - compliantFaculty;
    const complianceRate = totalFaculty > 0 ? (compliantFaculty / totalFaculty) * 100 : 0;

    return NextResponse.json({
      summary: {
        totalFaculty,
        compliantFaculty,
        nonCompliantFaculty,
        complianceRate: Math.round(complianceRate * 100) / 100
      },
      details: complianceData
    });
  } catch (error) {
    console.error("NEP compliance fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch NEP compliance data" }, { status: 500 });
  }
}