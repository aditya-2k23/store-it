import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

function assertValidSupabaseUrl(url: string | undefined): asserts url is string {
  if (!url) {
    throw new Error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL is not set. " +
        "Add it to your environment variables (Vercel dashboard → Settings → Environment Variables).",
    );
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.hostname === "undefined") {
      throw new Error("Hostname is empty or 'undefined'");
    }
  } catch {
    throw new Error(
      `[Supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${url}". ` +
        "It should look like https://<project-ref>.supabase.co",
    );
  }
}

export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  assertValidSupabaseUrl(supabaseUrl);

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Add it to your environment variables (Vercel dashboard → Settings → Environment Variables).",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
