import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("reminders").select("*").eq("clerk_user_id", userId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Reminders lookup failed" }, { status: 502 });
  return NextResponse.json({ reminders: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const time = typeof body.timeLocal === "string" ? body.timeLocal : "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NextResponse.json({ error: "Use a valid local time" }, { status: 400 });
  const days = Array.isArray(body.days) ? body.days.filter((day: unknown) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6).map(Number) : [0, 1, 2, 3, 4, 5, 6];
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("reminders").insert({ clerk_user_id: userId, label: typeof body.label === "string" ? body.label.trim().slice(0, 120) || "Daily practice" : "Daily practice", time_local: time, timezone: typeof body.timezone === "string" ? body.timezone.slice(0, 80) : "UTC", days, enabled: body.enabled !== false }).select().single();
  if (error) return NextResponse.json({ error: "Reminder save failed" }, { status: 502 });
  return NextResponse.json({ reminder: data }, { status: 201 });
}
