"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  notes?: string;
}

export default function FacultyAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch("/api/faculty/attendance");
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
        
        // Find today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = data.find((record: AttendanceRecord) => 
          record.date.startsWith(today)
        );
        setTodayAttendance(todayRecord || null);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance records");
    }
  };

  const handleAttendance = async (action: "checkin" | "checkout") => {
    setLoading(true);
    try {
      const response = await fetch("/api/faculty/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully ${action === "checkin" ? "checked in" : "checked out"}`);
        fetchAttendance();
      } else {
        toast.error(data.error || "Failed to process attendance");
      }
    } catch (error) {
      console.error("Attendance error:", error);
      toast.error("An error occurred while processing attendance");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="default" className="bg-green-100 text-green-800">Present</Badge>;
      case "ABSENT":
        return <Badge variant="destructive">Absent</Badge>;
      case "LEAVE":
        return <Badge variant="secondary">Leave</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Attendance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {todayAttendance ? getStatusBadge(todayAttendance.status) : <Badge variant="outline">Not recorded</Badge>}
              </div>
              
              {todayAttendance?.checkIn && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Check-in: {new Date(todayAttendance.checkIn).toLocaleTimeString()}</span>
                </div>
              )}
              
              {todayAttendance?.checkOut && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Check-out: {new Date(todayAttendance.checkOut).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleAttendance("checkin")}
                disabled={loading || !!todayAttendance?.checkIn}
                variant="outline"
              >
                {loading ? "Processing..." : "Check In"}
              </Button>
              <Button
                onClick={() => handleAttendance("checkout")}
                disabled={loading || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
                variant="outline"
              >
                {loading ? "Processing..." : "Check Out"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Last 30 days attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(record.date).toLocaleDateString("en-US", { 
                        weekday: "short", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {record.checkIn && (
                        <span>In: {new Date(record.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                      {record.checkOut && (
                        <span>Out: {new Date(record.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(record.status)}
                  {record.notes && (
                    <span className="text-sm text-muted-foreground max-w-32 truncate">
                      {record.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}