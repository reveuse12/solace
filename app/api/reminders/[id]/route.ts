import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const update: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") update.enabled = body.enabled;
  if (typeof body.label === "string") update.label = body.label.trim().slice(0, 120) || "Daily practice";
  if (typeof body.timeLocal === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.timeLocal)) update.time_local = body.timeLocal;
  if (Array.isArray(body.days)) update.days = body.days.filter((day: unknown) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6).map(Number);
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("reminders").update(update).eq("id", id).eq("clerk_user_id", userId).select().single();
  if (error) return NextResponse.json({ error: "Reminder update failed" }, { status: 502 });
  return NextResponse.json({ reminder: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await client.from("reminders").delete().eq("id", id).eq("clerk_user_id", userId);
  if (error) return NextResponse.json({ error: "Reminder deletion failed" }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
