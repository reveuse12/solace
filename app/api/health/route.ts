import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    clerk: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    vapid: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  };
  const healthy = checks.clerk && checks.supabase;
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
