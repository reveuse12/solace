import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "Intention is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("intentions").update({ body: text, updated_at: new Date().toISOString() }).eq("id", id).eq("clerk_user_id", userId).select().single();
  if (error) return NextResponse.json({ error: "Intention update failed" }, { status: 502 });
  return NextResponse.json({ intention: data });
}
