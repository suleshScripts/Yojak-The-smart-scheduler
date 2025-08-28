"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

interface LeaveRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  notes?: string;
}

export default function FacultyLeave() {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  useEffect(() => {
    fetchLeaveRecords();
  }, []);

  const fetchLeaveRecords = async () => {
    try {
      const response = await fetch("/api/faculty/leave");
      if (response.ok) {
        const data = await response.json();
        setLeaveRecords(data);
      }
    } catch (error) {
      console.error("Error fetching leave records:", error);
      toast.error("Failed to fetch leave records");
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveDate || !leaveReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/faculty/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: leaveDate,
          reason: leaveReason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Leave request submitted successfully");
        setLeaveDate("");
        setLeaveReason("");
        fetchLeaveRecords();
      } else {
        toast.error(data.error || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Leave submission error:", error);
      toast.error("An error occurred while submitting leave request");
    } finally {
      setIsSubmitting(false);
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
      {/* Leave Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Request Leave
          </CardTitle>
          <CardDescription>
            Submit a leave request for a specific date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitLeave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave-date">Date</Label>
                <Input
                  id="leave-date"
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-reason">Reason</Label>
                <Textarea
                  id="leave-reason"
                  placeholder="Please provide a reason for your leave request"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                  rows={3}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !leaveDate || !leaveReason}
              className="w-full md:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leave Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Records
          </CardTitle>
          <CardDescription>
            Your leave request history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaveRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No leave records found
              </p>
            ) : (
              leaveRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(record.date).toLocaleDateString("en-US", { 
                          weekday: "long", 
                          year: "numeric", 
                          month: "long", 
                          day: "numeric" 
                        })}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}