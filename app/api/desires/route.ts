import { insertOnce } from "@/utils/insert-once";
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
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";
  if (!text) return NextResponse.json({ error: "Desire is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await insertOnce(client, "desires", userId, { body: text, category: typeof body.category === "string" ? body.category.slice(0, 80) : null }, body.clientId);
  if (result.error) return NextResponse.json({ error: typeof result.error === "string" ? result.error : "Couldn't save your entry" }, { status: result.status });
  return NextResponse.json({ desire: result.data }, { status: result.status });
}
