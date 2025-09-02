import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function supa() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
}

async function getUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { data } = await supa().auth.getUser(token);
  return data.user;
}

function indiaHolidays(year: number) {
  // Minimal national list (can be expanded): Republic Day, Independence Day, Gandhi Jayanti, Diwali (approx), Holi (approx), Christmas
  return [
    { name: "Republic Day", date: new Date(year, 0, 26), type: "NATIONAL", description: "National holiday" },
    { name: "Independence Day", date: new Date(year, 7, 15), type: "NATIONAL", description: "National holiday" },
    { name: "Gandhi Jayanti", date: new Date(year, 9, 2), type: "NATIONAL", description: "National holiday" },
    { name: "Christmas", date: new Date(year, 11, 25), type: "NATIONAL", description: "Festival" },
  ];
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await db.holiday.count();
  if (count === 0) {
    const year = new Date().getFullYear();
    const seeds = indiaHolidays(year);
    await db.holiday.createMany({
      data: seeds.map(h => ({ name: h.name, date: h.date, type: "NATIONAL", description: h.description || null }))
    });
  }

  const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(holidays);
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.user_metadata as any)?.role || "STUDENT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, date, type, description } = body;

  const holiday = await db.holiday.create({
    data: { name, date: new Date(date), type, description: description || null }
  });

  return NextResponse.json(holiday);
}