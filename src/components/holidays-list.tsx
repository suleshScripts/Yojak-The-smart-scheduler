"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/lib/supabase-auth";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  description?: string | null;
}

export default function HolidaysList() {
  const { session } = useSupabaseAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const res = await fetch("/api/holidays", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    })();
  }, [session]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indian National Holidays</CardTitle>
      </CardHeader>
      <CardContent>
        {holidays.length === 0 ? (
          <p>No holidays found.</p>
        ) : (
          <div className="space-y-2">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{h.name}</div>
                  {h.description && <div className="text-sm text-gray-600">{h.description}</div>}
                </div>
                <div className="text-sm">{new Date(h.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
