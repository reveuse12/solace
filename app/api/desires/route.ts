import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";
import { rateLimit } from "@/utils/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("desires").select("*").eq("clerk_user_id", userId).neq("status", "archived").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Desires lookup failed" }, { status: 502 });
  return NextResponse.json({ desires: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`desire:${userId}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";
  if (!text) return NextResponse.json({ error: "Desire is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("desires").insert({ clerk_user_id: userId, body: text, category: body.category || null }).select().single();
  if (error) return NextResponse.json({ error: "Desire save failed" }, { status: 502 });
  return NextResponse.json({ desire: data }, { status: 201 });
}
