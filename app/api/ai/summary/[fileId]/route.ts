import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Reuse the same model chains as the Edge Function
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

/**
 * Call a Gemini generative model with text-only prompt.
 */
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

/**
 * Call a Gemini vision model with inline image data.
 */
async function callGenerativeModelWithImage(
  apiKey: string,
  prompt: string,
  imageBase64: string,
  mimeType: string,
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
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: imageBase64 } },
                  { text: prompt },
                ],
              },
            ],
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

// Extensions that can be meaningfully text-extracted without a parser library
const SUMMARIZABLE_EXTENSIONS = new Set([
  "txt", "md", "csv", "html", "htm", "rtf", "log",
  "json", "xml", "yaml", "yml", "pdf", "doc", "docx",
]);

// Binary formats that produce garbage when decoded as UTF-8
const BINARY_DOCUMENT_EXTENSIONS = new Set([
  "xls", "xlsx", "ods", "ppt", "pptx", "odp",
  "pages", "numbers", "key", "fig", "psd", "ai",
  "indd", "xd", "sketch", "afdesign", "afphoto", "epub",
]);

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
      .select("summary, processing_status, error_message, updated_at")
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

    // Still processing or pending
    if (
      aiMeta.processing_status === "processing" ||
      aiMeta.processing_status === "pending"
    ) {
      return NextResponse.json({ summary: null, status: "processing" });
    }

    // Summary already cached
    if (aiMeta.processing_status === "completed" && aiMeta.summary) {
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

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    // Binary document formats cannot be meaningfully summarised without a parser
    if (BINARY_DOCUMENT_EXTENSIONS.has(ext)) {
      return NextResponse.json({ summary: null, status: "not_applicable" });
    }

    // 60-second guard to avoid duplicate generation triggers on polling
    if (aiMeta.updated_at) {
      const secondsSinceUpdate =
        (Date.now() - new Date(aiMeta.updated_at).getTime()) / 1000;
      if (secondsSinceUpdate < 60) {
        return NextResponse.json({ summary: null, status: "processing" });
      }
    }

    // Immediately bump updated_at to indicate generation has started
    await supabase
      .from("ai_metadata")
      .update({ updated_at: new Date().toISOString() })
      .eq("file_id", fileId);

    // Kick off generation asynchronously
    (async () => {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
          .download(file.storage_key);

        if (downloadError || !fileData) {
          console.error("Failed to download file for summary");
          return;
        }

        const fileBytes = new Uint8Array(await fileData.arrayBuffer());
        let summaryText = "";

        if (file.type === "image") {
          let base64 = "";
          const chunkSize = 8192;
          for (let i = 0; i < fileBytes.length; i += chunkSize) {
            const chunk = fileBytes.subarray(i, i + chunkSize);
            base64 += String.fromCharCode(...chunk);
          }
          base64 = btoa(base64);

          const mimeType =
            file.mime_type || `image/${ext === "jpg" ? "jpeg" : ext}`;
          const imagePrompt =
            "Summarize the content of this image in 2 to 3 sentences. Describe what is shown, any visible text, and the overall context.";

          summaryText = await callGenerativeModelWithImage(
            geminiApiKey,
            imagePrompt,
            base64,
            mimeType,
            1024,
          );
        } else {
          const textContent = extractTextFromBytes(
            fileBytes,
            file.mime_type,
            file.name,
          );

          if (!textContent) {
            await supabase
              .from("ai_metadata")
              .update({ processing_status: "not_applicable" })
              .eq("file_id", fileId);
            return;
          }

          const truncated = truncateToTokenLimit(textContent, 8000);
          const prompt = `Summarize this document in 2 to 3 sentences. Be concise and factual. Focus on what the document contains, not how it is structured.\n\n${truncated}`;

          summaryText = await callGenerativeModel(geminiApiKey, prompt, 1024);
        }

        const endsCleanly = /[.!?]$/.test(summaryText.trim());
        const finalSummary = endsCleanly
          ? summaryText.trim()
          : summaryText.trim() + "...";

        await supabase
          .from("ai_metadata")
          .update({ summary: finalSummary })
          .eq("file_id", fileId);
      } catch (err: any) {
        console.error("Async summary generation failed:", err);
      }
    })();

    // Return processing immediately while generation runs in background
    return NextResponse.json({ summary: null, status: "processing" });
  } catch (error) {
    console.error("AI summary error:", error);
    return NextResponse.json(
      { summary: null, status: "failed", error: "Internal server error" },
      { status: 500 },
    );
  }
}
