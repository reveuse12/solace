import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim().slice(0, 160);
  if (typeof body.prompt === "string") update.prompt = body.prompt.slice(0, 3000);
  if (typeof body.mood === "string") update.mood = body.mood.slice(0, 80);
  if (typeof body.completed === "boolean") update.completed = body.completed;
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("visualizations").update(update).eq("id", id).eq("clerk_user_id", userId).select().single();
  if (error) return NextResponse.json({ error: "Visualization update failed" }, { status: 502 });
  return NextResponse.json({ visualization: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await client.from("visualizations").delete().eq("id", id).eq("clerk_user_id", userId);
  if (error) return NextResponse.json({ error: "Visualization deletion failed" }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
