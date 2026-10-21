import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await client.from("push_subscriptions").upsert({ clerk_user_id: userId, endpoint: String(body.endpoint).slice(0, 2000), p256dh: String(body.keys.p256dh).slice(0, 500), auth: String(body.keys.auth).slice(0, 500), updated_at: new Date().toISOString() }, { onConflict: "clerk_user_id,endpoint" });
  if (error) return NextResponse.json({ error: "Push subscription save failed" }, { status: 502 });
  return NextResponse.json({ subscribed: true });
}
