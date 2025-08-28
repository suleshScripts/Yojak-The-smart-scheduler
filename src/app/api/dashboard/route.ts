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

    const { role } = session.user;

    let dashboardData = {
      totalSubjects: 0,
      totalFaculty: 0,
      totalStudents: 0,
      pendingApprovals: 0,
      upcomingClasses: [],
      recentHolidays: [],
    };

    if (role === "ADMIN") {
      // Admin dashboard data
      const [subjects, faculty, students, pendingUsers] = await Promise.all([
        db.subject.count(),
        db.user.count({ where: { role: "FACULTY" } }),
        db.user.count({ where: { role: "STUDENT" } }),
        db.user.count({ where: { verificationStatus: "PENDING" } }),
      ]);

      dashboardData = {
        ...dashboardData,
        totalSubjects: subjects,
        totalFaculty: faculty,
        totalStudents: students,
        pendingApprovals: pendingUsers,
      };
    } else if (role === "FACULTY") {
      // Faculty dashboard data
      const faculty = await db.facultyProfile.findFirst({
        where: { userId: session.user.id },
        include: {
          subjects: {
            include: {
              subject: true
            }
          },
          timetableEntries: {
            include: {
              subject: true,
              classroom: true
            }
          }
        }
      });

      if (faculty) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const todayClasses = faculty.timetableEntries.filter(entry => entry.dayOfWeek === dayOfWeek);

        dashboardData.upcomingClasses = todayClasses.map(entry => ({
          subject: entry.subject.name,
          time: `${entry.startTime.toLocaleTimeString()} - ${entry.endTime.toLocaleTimeString()}`,
          classroom: entry.classroom.name,
          type: entry.classType,
        }));
      }
    } else if (role === "STUDENT") {
      // Student dashboard data
      const student = await db.studentProfile.findFirst({
        where: { userId: session.user.id },
        include: {
          department: {
            include: {
              subjects: true,
              timetableEntries: {
                include: {
                  subject: true,
                  classroom: true,
                  faculty: {
                    include: {
                      user: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (student && student.department) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayClasses = student.department.timetableEntries.filter(entry => entry.dayOfWeek === dayOfWeek);

        dashboardData.upcomingClasses = todayClasses.map(entry => ({
          subject: entry.subject.name,
          time: `${entry.startTime.toLocaleTimeString()} - ${entry.endTime.toLocaleTimeString()}`,
          classroom: entry.classroom.name,
          type: entry.classType,
          faculty: entry.faculty.user.name || "Unknown",
        }));
      }
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}