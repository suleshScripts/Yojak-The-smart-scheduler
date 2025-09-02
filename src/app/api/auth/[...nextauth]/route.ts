import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export async function GET() {
  return new Response("Not Found", { status: 404 });
}

export async function POST() {
  return new Response("Not Found", { status: 404 });
}