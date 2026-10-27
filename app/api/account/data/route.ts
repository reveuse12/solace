import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await client.from("profiles").delete().eq("clerk_user_id", userId);
  if (error) return NextResponse.json({ error: "Account data deletion failed" }, { status: 502 });
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
  } catch {
    return NextResponse.json({ error: "Your app data was removed, but the Clerk account could not be deleted" }, { status: 502 });
  }
  return NextResponse.json({ deleted: true });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const data = body?.data;
  if (!data || typeof data !== "object") return NextResponse.json({ error: "Invalid backup file" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: result, error } = await client.rpc("restore_account_backup", { backup: data });
  if (error) return NextResponse.json({ error: "The backup could not be restored. No changes were applied. Check the file and try again." }, { status: 422 });
  return NextResponse.json(result);
}
