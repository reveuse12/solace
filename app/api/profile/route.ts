import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("profiles").select("*").eq("clerk_user_id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: "Profile lookup failed" }, { status: 502 });
  return NextResponse.json({ profile: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const profile = {
    clerk_user_id: userId,
    display_name: typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : null,
    focus: typeof body.focus === "string" ? body.focus.trim().slice(0, 80) : null,
    practice_time: typeof body.practiceTime === "string" ? body.practiceTime.trim().slice(0, 80) : null,
    location: typeof body.location === "string" ? body.location.trim().slice(0, 120) : null,
    avatar_url: typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 500) : null,
    privacy_consent_at: body.privacyConsent === true ? new Date().toISOString() : null,
    privacy_consent_version: body.privacyConsent === true ? "2026-10-21" : null,
    updated_at: new Date().toISOString(),
  };

  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await client.from("profiles").upsert(profile).select().single();
  if (error) return NextResponse.json({ error: "Profile sync failed" }, { status: 502 });
  return NextResponse.json({ profile: data });
}
