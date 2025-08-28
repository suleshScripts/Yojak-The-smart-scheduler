"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Users, Clock } from "lucide-react";
import { toast } from "sonner";

interface NEPComplianceData {
  faculty: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  compliance: {
    id: string;
    teachingHours: number;
    nonTeachingHours: number;
    studentInteractionHours: number;
    totalHours: number;
    maxAllowedHours: number;
    isCompliant: boolean;
    week: string;
  };
  weekEntries: number;
}

interface NEPComplianceResponse {
  summary: {
    totalFaculty: number;
    compliantFaculty: number;
    nonCompliantFaculty: number;
    complianceRate: number;
  };
  details: NEPComplianceData[];
}

export default function NEPComplianceDashboard() {
  const [complianceData, setComplianceData] = useState<NEPComplianceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/nep-compliance");
      if (response.ok) {
        const data = await response.json();
        setComplianceData(data);
      } else {
        toast.error("Failed to fetch NEP compliance data");
      }
    } catch (error) {
      console.error("Error fetching NEP compliance data:", error);
      toast.error("An error occurred while fetching NEP compliance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!complianceData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load NEP compliance data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const { summary, details } = complianceData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalFaculty}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.compliantFaculty}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.nonCompliantFaculty}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.complianceRate}%</div>
            <Progress value={summary.complianceRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* NEP 2020 Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>NEP 2020 Compliance Guidelines</CardTitle>
          <CardDescription>
            Key requirements for faculty workload and student interaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Maximum Weekly Hours</span>
              </div>
              <p className="text-sm text-muted-foreground">40 hours per week including teaching and non-teaching activities</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium">Minimum Teaching Hours</span>
              </div>
              <p className="text-sm text-muted-foreground">16 hours of direct teaching per week</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Student Interaction</span>
              </div>
              <p className="text-sm text-muted-foreground">8 hours of student interaction per week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Faculty Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Compliance Details</CardTitle>
          <CardDescription>
            Detailed breakdown of each faculty member's compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {details.map((detail) => (
              <div key={detail.faculty.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{detail.faculty.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {detail.faculty.email} • {detail.faculty.department}
                    </p>
                  </div>
                  <Badge variant={detail.compliance.isCompliant ? "default" : "destructive"}>
                    {detail.compliance.isCompliant ? "Compliant" : "Non-Compliant"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Teaching Hours</p>
                    <p className="font-medium">{detail.compliance.teachingHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Student Interaction</p>
                    <p className="font-medium">{detail.compliance.studentInteractionHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Hours</p>
                    <p className="font-medium">{detail.compliance.totalHours}h / {detail.compliance.maxAllowedHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Classes This Week</p>
                    <p className="font-medium">{detail.weekEntries}</p>
                  </div>
                </div>
                
                {!detail.compliance.isCompliant && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      This faculty member is not compliant with NEP 2020 guidelines. 
                      Please review their workload and adjust accordingly.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={fetchComplianceData} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
}