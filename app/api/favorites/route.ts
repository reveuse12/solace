import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("favorites").select("audio_key, created_at").eq("clerk_user_id", userId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Favorites lookup failed" }, { status: 502 });
  return NextResponse.json({ favorites: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const audioKey = typeof body.audioKey === "string" ? body.audioKey.slice(0, 120) : "";
  if (!audioKey) return NextResponse.json({ error: "Audio key is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (body.favorite === false) {
    const { error } = await client.from("favorites").delete().eq("clerk_user_id", userId).eq("audio_key", audioKey);
    if (error) return NextResponse.json({ error: "Favorite removal failed" }, { status: 502 });
    return NextResponse.json({ favorite: false });
  }
  const { error } = await client.from("favorites").upsert({ clerk_user_id: userId, audio_key: audioKey });
  if (error) return NextResponse.json({ error: "Favorite save failed" }, { status: 502 });
  return NextResponse.json({ favorite: true });
}
