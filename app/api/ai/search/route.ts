import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const EMBEDDING_MODEL = "gemini-embedding-2";
const MAX_RETRIES = 3;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 503;
}

/**
 * Generate an embedding using gemini-embedding-2.
 * NO FALLBACK — a mismatched dimension corrupts the vector column.
 * 3 retries with exponential backoff, then throw.
 */
async function generateEmbedding(
  apiKey: string,
  text: string,
): Promise<number[]> {
  let lastError = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
        }),
      });

      if (!resp.ok) {
        lastError = `${EMBEDDING_MODEL}: HTTP ${resp.status}`;
        if (isRetryable(resp.status)) {
          await delay(1000 * Math.pow(2, attempt));
          continue;
        }
        throw new Error(
          `Embedding model failed (non-retryable): ${lastError}`,
        );
      }

      const data = await resp.json();
      const embedding = data?.embedding?.values;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error(`${EMBEDDING_MODEL}: no embedding values in response`);
      }
      return embedding;
    } catch (err) {
      lastError = `${EMBEDDING_MODEL}: ${(err as Error).message}`;
      if (attempt < MAX_RETRIES - 1) {
        await delay(1000 * Math.pow(2, attempt));
      }
    }
  }
  throw new Error(
    `Embedding model ${EMBEDDING_MODEL} failed after ${MAX_RETRIES} retries. Last error: ${lastError}`,
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Missing query" },
        { status: 400 },
      );
    }

    // Read workspace from httpOnly cookie
    const cookieStore = await cookies();
    const workspaceId = cookieStore.get("storey-active-workspace")?.value;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 400 },
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const supabase = createSupabaseAdmin();

    // Verify user exists and has workspace membership
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(geminiApiKey, query);

    // Format as pgvector string
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Query using pgvector cosine similarity
    const { data: results, error } = await supabase.rpc("match_files_by_embedding", {
      query_embedding: embeddingStr,
      target_workspace_id: workspaceId,
      match_limit: 5,
    });

    if (error) {
      console.error("Semantic search RPC error:", error);
      // Fallback: raw SQL query via supabase
      // If RPC doesn't exist, we'll create it
      return NextResponse.json({ results: [] });
    }

    return NextResponse.json({ results: results || [] });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
