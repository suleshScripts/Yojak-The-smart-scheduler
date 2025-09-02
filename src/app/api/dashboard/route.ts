import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

async function getAuthenticatedPrismaUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const email = data.user.email;
  if (!email) return null;
  const prismaUser = await db.user.findUnique({ where: { email } });
  return prismaUser;
}

export async function GET(request: Request) {
  try {
    const prismaUser = await getAuthenticatedPrismaUser(request);
    if (!prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = prismaUser.role;

    let dashboardData: any = {
      totalSubjects: 0,
      totalFaculty: 0,
      totalStudents: 0,
      pendingApprovals: 0,
      upcomingClasses: [],
      recentHolidays: [],
    };

    if (role === "ADMIN") {
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
      const faculty = await db.facultyProfile.findFirst({
        where: { userId: prismaUser.id },
        include: {
          subjects: { include: { subject: true } },
          timetableEntries: { include: { subject: true, classroom: true } },
        },
      });

      if (faculty) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayClasses = faculty.timetableEntries.filter(entry => entry.dayOfWeek === dayOfWeek);

        dashboardData.upcomingClasses = todayClasses.map(entry => ({
          subject: entry.subject.name,
          time: `${entry.startTime.toLocaleTimeString()} - ${entry.endTime.toLocaleTimeString()}`,
          classroom: entry.classroom.name,
          type: entry.classType,
        }));
      }
    } else if (role === "STUDENT") {
      const student = await db.studentProfile.findFirst({
        where: { userId: prismaUser.id },
        include: {
          department: {
            include: {
              subjects: true,
              timetableEntries: {
                include: {
                  subject: true,
                  classroom: true,
                  faculty: { include: { user: true } },
                },
              },
            },
          },
        },
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