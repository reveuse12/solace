import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : "";
  if (!text) return NextResponse.json({ error: "Reflection is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("reflections").update({ body: text }).eq("id", id).eq("clerk_user_id", userId).select().single();
  if (error) return NextResponse.json({ error: "Reflection update failed" }, { status: 502 });
  return NextResponse.json({ reflection: data });
}
