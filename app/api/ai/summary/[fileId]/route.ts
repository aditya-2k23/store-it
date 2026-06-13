import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Reuse the same model chains and utilities as the Edge Function
const GENERATIVE_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
];

const MAX_RETRIES_PER_MODEL = 3;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 503;
}

async function callGenerativeModel(
  apiKey: string,
  prompt: string,
  maxOutputTokens: number,
): Promise<string> {
  let lastError = "";

  for (const model of GENERATIVE_MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens },
          }),
        });

        if (!resp.ok) {
          if (isRetryable(resp.status)) {
            await delay(1000 * Math.pow(2, attempt));
            continue;
          }
          lastError = `${model}: HTTP ${resp.status}`;
          break;
        }

        const data = await resp.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        if (!text) {
          lastError = `${model}: empty response`;
          break;
        }
        return text;
      } catch (err) {
        lastError = `${model}: ${(err as Error).message}`;
        await delay(1000 * Math.pow(2, attempt));
      }
    }
  }
  throw new Error(lastError);
}

function truncateToTokenLimit(text: string, maxTokens = 8000): string {
  const maxChars = maxTokens * 4;
  return text.length <= maxChars ? text : text.slice(0, maxChars);
}

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "csv", "html", "htm", "rtf", "log", "json", "xml", "yaml", "yml",
]);

function extractTextFromBytes(
  bytes: Uint8Array,
  mimeType: string | null,
  fileName: string,
): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (
    mimeType?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)
  ) {
    return null;
  }

  if (
    TEXT_EXTENSIONS.has(ext) ||
    mimeType?.startsWith("text/") ||
    mimeType === "application/json"
  ) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  if (ext === "pdf" || mimeType === "application/pdf") {
    const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const textParts: string[] = [];
    const regex = /\(([^)]*)\)/g;
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      const cleaned = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\\\/g, "\\")
        .replace(/\\([()])/g, "$1");
      if (cleaned.trim()) textParts.push(cleaned);
    }
    return textParts.join(" ").trim() || `PDF document: ${fileName}`;
  }

  return `Document: ${fileName}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const supabase = createSupabaseAdmin();

    // Get user's Supabase ID from Clerk ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the file and verify workspace membership
    const { data: file } = await supabase
      .from("files")
      .select("id, name, mime_type, extension, type, storage_key, workspace_id")
      .eq("id", fileId)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("workspace_id", file.workspace_id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check ai_metadata for this file
    const { data: aiMeta } = await supabase
      .from("ai_metadata")
      .select("summary, processing_status, error_message")
      .eq("file_id", fileId)
      .maybeSingle();

    // No metadata row exists yet
    if (!aiMeta) {
      return NextResponse.json({ summary: null, status: "pending" });
    }

    // Not applicable
    if (aiMeta.processing_status === "not_applicable") {
      return NextResponse.json({ summary: null, status: "not_applicable" });
    }

    // Failed
    if (aiMeta.processing_status === "failed") {
      return NextResponse.json({
        summary: null,
        status: "failed",
        error: aiMeta.error_message,
      });
    }

    // Still processing
    if (aiMeta.processing_status === "processing") {
      return NextResponse.json({ summary: null, status: "processing" });
    }

    // Summary already cached
    if (aiMeta.summary) {
      return NextResponse.json({
        summary: aiMeta.summary,
        status: "completed",
      });
    }

    // Status is 'completed' (tags done) but no summary yet — generate on demand
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({
        summary: null,
        status: "failed",
        error: "GEMINI_API_KEY not configured",
      });
    }

    // Download file for summary generation
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
      .download(file.storage_key);

    if (downloadError || !fileData) {
      return NextResponse.json({
        summary: null,
        status: "failed",
        error: "Failed to download file",
      });
    }

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());
    const textContent = extractTextFromBytes(
      fileBytes,
      file.mime_type,
      file.name,
    );

    if (!textContent) {
      // For images, generate summary using vision
      // For now, return a simple status
      return NextResponse.json({
        summary: null,
        status: "completed",
      });
    }

    const truncated = truncateToTokenLimit(textContent, 8000);
    const prompt = `Summarize this document in 2 to 3 sentences. Be concise and factual. Focus on what the document contains, not how it is structured.\n\n${truncated}`;

    const summaryText = await callGenerativeModel(geminiApiKey, prompt, 512);

    // Cache the summary
    await supabase
      .from("ai_metadata")
      .update({ summary: summaryText })
      .eq("file_id", fileId);

    return NextResponse.json({
      summary: summaryText,
      status: "completed",
    });
  } catch (error) {
    console.error("AI summary error:", error);
    return NextResponse.json(
      { summary: null, status: "failed", error: "Internal server error" },
      { status: 500 },
    );
  }
}
