import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("intentions").select("*").eq("clerk_user_id", userId).eq("status", "active").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Intentions lookup failed" }, { status: 502 });
  return NextResponse.json({ intentions: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "Intention is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("intentions").insert({ clerk_user_id: userId, body: text, category: body.category || null }).select().single();
  if (error) return NextResponse.json({ error: "Intention save failed" }, { status: 502 });
  return NextResponse.json({ intention: data }, { status: 201 });
}
