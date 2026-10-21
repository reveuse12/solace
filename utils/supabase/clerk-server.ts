import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Supabase client authenticated with the current Clerk user's JWT.
 * Create a Clerk JWT template named `supabase` before using this helper.
 */
export async function createClerkSupabaseClient() {
  const { userId, getToken } = await auth();
  if (!userId) return { client: null, userId: null };

  const token = await getToken({ template: "supabase" });
  if (!token) throw new Error("Missing Clerk Supabase JWT template");

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      accessToken: async () => token,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return { client, userId };
}
