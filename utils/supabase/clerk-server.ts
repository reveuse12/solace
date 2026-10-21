import { createServerClient } from "@supabase/ssr";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

/**
 * Supabase client authenticated with the current Clerk user's JWT.
 * Create a Clerk JWT template named `supabase` before using this helper.
 */
export async function createClerkSupabaseClient() {
  const { userId, getToken } = await auth();
  if (!userId) return { client: null, userId: null };

  const token = await getToken({ template: "supabase" });
  if (!token) throw new Error("Missing Clerk Supabase JWT template");

  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      accessToken: async () => token,
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot write cookies.
          }
        },
      },
    },
  );

  return { client, userId };
}
