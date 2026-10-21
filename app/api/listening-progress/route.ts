import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("listening_progress").select("*").eq("clerk_user_id", userId);
  if (error) return NextResponse.json({ error: "Progress lookup failed" }, { status: 502 });
  return NextResponse.json({ progress: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const audioKey = typeof body.audioKey === "string" ? body.audioKey.slice(0, 120) : "";
  if (!audioKey) return NextResponse.json({ error: "Audio key is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("listening_progress").upsert({ clerk_user_id: userId, audio_key: audioKey, position_seconds: Math.max(0, Math.floor(Number(body.positionSeconds) || 0)), completed: Boolean(body.completed), updated_at: new Date().toISOString() }).select().single();
  if (error) return NextResponse.json({ error: "Progress save failed" }, { status: 502 });
  return NextResponse.json({ progress: data });
}
