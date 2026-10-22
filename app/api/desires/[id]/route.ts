import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json();
  const changes: Record<string, string> = {};
  if (typeof body.body === "string") changes.body = body.body.trim().slice(0, 1000);
  if (["active", "manifested", "archived"].includes(body.status)) changes.status = body.status;
  if (!Object.keys(changes).length) return NextResponse.json({ error: "No changes" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("desires").update(changes).eq("id", id).eq("clerk_user_id", userId).select().single();
  if (error) return NextResponse.json({ error: "Desire update failed" }, { status: 502 });
  return NextResponse.json({ desire: data });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await client.from("desires").update({ status: "archived" }).eq("id", id).eq("clerk_user_id", userId);
  if (error) return NextResponse.json({ error: "Desire archive failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
