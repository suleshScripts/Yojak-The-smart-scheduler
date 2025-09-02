"use client";

import { useSupabaseAuth } from "@/lib/supabase-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import EmergencyRescheduler from "@/components/emergency-rescheduler";
import FacultyAttendance from "@/components/faculty-attendance";
import FacultyLeave from "@/components/faculty-leave";
import SyllabusTracker from "@/components/syllabus-tracker";
import RealTimeNotifications from "@/components/real-time-notifications";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth-guard";
import HolidaysList from "@/components/holidays-list";

interface DashboardData {
  totalSubjects: number;
  totalFaculty: number;
  totalStudents: number;
  pendingApprovals: number;
  upcomingClasses: any[];
  recentHolidays: any[];
}

function DashboardContent() {
  const { user, session, signOut } = useSupabaseAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSubjects: 0,
    totalFaculty: 0,
    totalStudents: 0,
    pendingApprovals: 0,
    upcomingClasses: [],
    recentHolidays: [],
  });

  useEffect(() => {
    if (!session) return;

    // Load dashboard data based on role
    loadDashboardData();
    const onFocus = () => loadDashboardData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [session]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const getRoleDashboard = () => {
    const role = user?.user_metadata?.role || "STUDENT";
    const verificationStatus = user?.user_metadata?.verificationStatus || "PENDING";

    if (verificationStatus === "PENDING") {
      return (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your account is pending approval. Please contact the administrator.
          </AlertDescription>
        </Alert>
      );
    }

    switch (role) {
      case "ADMIN":
        return <AdminDashboard data={dashboardData} />;
      case "FACULTY":
        return <FacultyDashboard data={dashboardData} />;
      case "STUDENT":
        return <StudentDashboard data={dashboardData} />;
      default:
        return (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Invalid role assigned. Please contact the administrator.
            </AlertDescription>
          </Alert>
        );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/signin");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Classroom Scheduler</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.user_metadata?.full_name || user?.email} ({user?.user_metadata?.role || "STUDENT"})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeNotifications />
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
      
      {getRoleDashboard()}
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { session } = useSupabaseAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTimetable = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/timetable/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          constraints: {
            maxDailyHours: 8,
            maxWeeklyHours: 40,
            minGapBetweenClasses: 15,
            preferredTimeSlots: [],
            labHoursRequired: true
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Timetable generated successfully");
      } else {
        toast.error(result.error || "Failed to generate timetable");
      }
    } catch (error) {
      console.error("Timetable generation error:", error);
      toast.error("An error occurred while generating timetable");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSubjects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalFaculty}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="overview"
        className="space-y-4"
        onValueChange={(val) => {
          if (val === "faculty") router.push('/admin/faculty');
          if (val === "subjects") router.push('/admin/subjects');
        }}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Management</TabsTrigger>
          <TabsTrigger value="subjects">Subject Management</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus Covered</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/admin/faculty')}>
                <Users className="h-6 w-6 mb-2" />
                <span className="text-sm">Manage Faculty</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/admin/subjects')}>
                <BookOpen className="h-6 w-6 mb-2" />
                <span className="text-sm">Manage Subjects</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/admin/departments')}>
                <CheckCircle className="h-6 w-6 mb-2" />
                <span className="text-sm">Manage Departments</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/admin/approvals')}>
                <CheckCircle className="h-6 w-6 mb-2" />
                <span className="text-sm">Approvals</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={handleGenerateTimetable}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                ) : (
                  <Calendar className="h-6 w-6 mb-2" />
                )}
                <span className="text-sm">Generate Timetable</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/faculty/schedule')}>
                <AlertTriangle className="h-6 w-6 mb-2" />
                <span className="text-sm">Faculty Schedule</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <EmergencyRescheduler />
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-4">
          <SyllabusTracker />
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <HolidaysList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FacultyDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24 / 40</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syllabus Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="subjects">My Subjects</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Request Leave</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.upcomingClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{classItem.subject}</p>
                      <p className="text-sm text-gray-600">{classItem.time} - {classItem.classroom}</p>
                    </div>
                    <Badge variant={classItem.type === "LAB" ? "destructive" : "secondary"}>
                      {classItem.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <FacultyAttendance />
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <FacultyLeave />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Semester</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4th</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timetable">My Timetable</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="labs">Lab Schedule</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.upcomingClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{classItem.subject}</p>
                      <p className="text-sm text-gray-600">{classItem.time} - {classItem.classroom}</p>
                      <p className="text-xs text-gray-500">{classItem.faculty}</p>
                    </div>
                    <Badge variant={classItem.type === "LAB" ? "destructive" : "secondary"}>
                      {classItem.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}