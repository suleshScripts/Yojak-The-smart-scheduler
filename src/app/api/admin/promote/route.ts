import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const setupTokenHeader = request.headers.get("x-setup-token") || "";
    const requiredSetupToken = process.env.ADMIN_SETUP_TOKEN || "";

    if (!requiredSetupToken || setupTokenHeader !== requiredSetupToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = await request.json();

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const allowedRoles = ["ADMIN", "FACULTY", "STUDENT"] as const;
    const targetRole = (role as typeof allowedRoles[number]) || "ADMIN";
    if (!allowedRoles.includes(targetRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server not configured: missing Supabase env" }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: targetRole,
        verificationStatus: "APPROVED",
        full_name: "Admin"
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
