"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface EmergencyReschedulerProps {
  onRescheduleComplete?: (data: any) => void;
}

export default function EmergencyRescheduler({ onRescheduleComplete }: EmergencyReschedulerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [emergencyDate, setEmergencyDate] = useState("");
  const [reason, setReason] = useState("");
  const [rescheduleType, setRescheduleType] = useState<"SHIFT_REMAINING" | "CANCEL_ALL">("SHIFT_REMAINING");
  const [result, setResult] = useState<any>(null);

  const handleEmergencyReschedule = async () => {
    if (!emergencyDate || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/timetable/reschedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emergencyDate,
          reason,
          rescheduleType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Emergency rescheduling completed successfully");
        setResult(data);
        onRescheduleComplete?.(data);
      } else {
        toast.error(data.error || "Failed to process emergency rescheduling");
      }
    } catch (error) {
      console.error("Emergency rescheduling error:", error);
      toast.error("An error occurred while processing emergency rescheduling");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Emergency Rescheduler
        </CardTitle>
        <CardDescription className="text-red-700">
          Use this feature only for emergencies like natural disasters, unexpected holidays, or urgent situations.
          This will automatically reschedule all affected classes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="emergency-date">Emergency Date</Label>
          <Input
            id="emergency-date"
            type="date"
            value={emergencyDate}
            onChange={(e) => setEmergencyDate(e.target.value)}
            className="border-red-200 focus:border-red-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Emergency</Label>
          <Textarea
            id="reason"
            placeholder="e.g., Natural disaster, unexpected holiday, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border-red-200 focus:border-red-400"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Rescheduling Option</Label>
          <div className="flex gap-4">
            <button
              onClick={() => setRescheduleType("SHIFT_REMAINING")}
              className={`p-4 border rounded-lg text-left flex-1 transition-colors ${
                rescheduleType === "SHIFT_REMAINING"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">Shift Remaining Classes</div>
              <div className="text-sm text-gray-600 mt-1">
                Move affected classes to remaining days of the week
              </div>
            </button>
            
            <button
              onClick={() => setRescheduleType("CANCEL_ALL")}
              className={`p-4 border rounded-lg text-left flex-1 transition-colors ${
                rescheduleType === "CANCEL_ALL"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">Cancel All Classes</div>
              <div className="text-sm text-gray-600 mt-1">
                Cancel all classes for the emergency day
              </div>
            </button>
          </div>
        </div>

        <Button
          onClick={handleEmergencyReschedule}
          disabled={isProcessing || !emergencyDate || !reason}
          className="w-full bg-red-600 hover:bg-red-700"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Processing Emergency Reschedule...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              🚨 Trigger Emergency Rescheduler
            </>
          )}
        </Button>

        {result && (
          <Alert className="bg-green-50 border-green-200">
            <Calendar className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p><strong>Emergency rescheduling completed!</strong></p>
                <p>Affected classes: {result.affectedEntries}</p>
                <p>Holiday created: {result.holiday.name}</p>
                <p className="text-sm text-green-700">
                  Notifications have been sent to all affected faculty members.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}