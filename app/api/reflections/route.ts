import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("reflections").select("id, body, created_at").eq("clerk_user_id", userId).order("created_at", { ascending: false }).limit(12);
  if (error) return NextResponse.json({ error: "Reflections lookup failed" }, { status: 502 });
  return NextResponse.json({ reflections: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : "";
  if (!text) return NextResponse.json({ error: "Reflection is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("reflections").insert({ clerk_user_id: userId, body: text }).select().single();
  if (error) return NextResponse.json({ error: "Reflection save failed" }, { status: 502 });
  return NextResponse.json({ reflection: data }, { status: 201 });
}
