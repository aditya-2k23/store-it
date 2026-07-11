import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore -- Deno URL import; resolved at runtime by Supabase Edge Runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  callGenerativeModel,
  callEmbeddingModel,
  extractTextContent,
} from "../_shared/gemini.ts";

// File types that should be processed with AI
const PROCESSABLE_TYPES = new Set(["document", "image"]);
const SKIP_TYPES = new Set(["video", "audio", "archive", "code", "other"]);

// Image extensions for inline processing
const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
]);

interface FileRecord {
  id: string;
  name: string;
  original_name: string;
  extension: string | null;
  mime_type: string | null;
  type: string;
  size: number;
  storage_key: string;
  workspace_id: string;
  owner_id: string | null;
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: FileRecord;
  schema: string;
  old_record: null;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function markFailed(fileId: string, errorMessage: string) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("ai_metadata").upsert(
      {
        file_id: fileId,
        processing_status: "failed",
        error_message: errorMessage,
      },
      { onConflict: "file_id" },
    );
  } catch (e) {
    console.error("Failed to mark ai_metadata as failed:", e);
  }
}

// ---------- Tag parsing helpers ----------

/**
 * Parse a JSON tag array from a raw Gemini response string.
 * Handles markdown code fences, varied formatting, and malformed JSON.
 * Never throws — always returns a (possibly empty) string[].
 */
function parseTagsFromResponse(raw: string): string[] {
  try {
    // Strip markdown code blocks
    let text = raw.trim()
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    // Try to find a JSON array anywhere in the response
    const arrayMatch = text.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5).map(String).filter(Boolean);
      }
    }

    // Fallback: try parsing the whole trimmed text as JSON
    const direct = JSON.parse(text);
    if (Array.isArray(direct)) {
      return direct.slice(0, 5).map(String).filter(Boolean);
    }

    return [];
  } catch {
    // Last resort: extract quoted strings that look like tags (2–30 chars)
    const quoted = raw.match(/"([^"]{2,30})"/g);
    if (quoted && quoted.length > 0) {
      return quoted.slice(0, 5).map((s) => s.replace(/"/g, "")).filter(Boolean);
    }
    return [];
  }
}

/**
 * Split a combined image response into description + tags.
 * Matches TAGS: marker case-insensitively, with optional surrounding asterisks.
 */
function parseImageResponse(
  raw: string,
): { description: string; tags: string[] } {
  const normalized = raw.trim();

  // Match TAGS: marker: optional leading newline/whitespace, optional **bold**, any casing
  const tagsMarkerMatch = normalized.match(/\n?\s*\*{0,2}tags\*{0,2}\s*:/i);

  if (tagsMarkerMatch && tagsMarkerMatch.index !== undefined) {
    const description = normalized.slice(0, tagsMarkerMatch.index).trim();
    const tagsSection = normalized
      .slice(tagsMarkerMatch.index + tagsMarkerMatch[0].length)
      .trim();
    const tags = parseTagsFromResponse(tagsSection);
    return { description: description || normalized, tags };
  }

  // No marker found — use full response as description, no tags
  return { description: normalized, tags: [] };
}

Deno.serve(async (req: Request) => {
  let fileId: string | null = null;

  try {
    const payload: WebhookPayload = await req.json();
    const fileRecord = payload.record;

    if (!fileRecord?.id) {
      return new Response(
        JSON.stringify({ ok: false, error: "No file record in payload" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    fileId = fileRecord.id;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
    const storageBucket = Deno.env.get("STORAGE_BUCKET") || "storey-files";
    const supabase = getSupabaseClient();

    // Determine if we should process this file type
    if (
      SKIP_TYPES.has(fileRecord.type) ||
      !PROCESSABLE_TYPES.has(fileRecord.type)
    ) {
      await supabase.from("ai_metadata").upsert(
        {
          file_id: fileRecord.id,
          processing_status: "not_applicable",
        },
        { onConflict: "file_id" },
      );

      return new Response(
        JSON.stringify({
          ok: true,
          status: "not_applicable",
          fileId: fileRecord.id,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Mark as processing
    await supabase.from("ai_metadata").upsert(
      {
        file_id: fileRecord.id,
        processing_status: "processing",
      },
      { onConflict: "file_id" },
    );

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(storageBucket)
      .download(fileRecord.storage_key);

    if (downloadError || !fileData) {
      throw new Error(
        `Failed to download file: ${downloadError?.message || "No data"}`,
      );
    }

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());
    const ext = fileRecord.extension?.toLowerCase() ?? "";
    const isImage = fileRecord.type === "image" || IMAGE_EXTENSIONS.has(ext);

    // Extract text or prepare image
    let textContent: string | null = null;
    let inlineImageData: { mimeType: string; data: string } | undefined;

    if (isImage) {
      // Convert image to base64 for Gemini inline_data
      // Use chunked conversion to avoid call stack overflow with large files
      let base64 = "";
      const chunkSize = 8192;
      for (let i = 0; i < fileBytes.length; i += chunkSize) {
        const chunk = fileBytes.subarray(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      base64 = btoa(base64);

      const mimeType =
        fileRecord.mime_type || `image/${ext === "jpg" ? "jpeg" : ext}`;
      inlineImageData = { mimeType, data: base64 };
    } else {
      textContent = extractTextContent(
        fileBytes,
        fileRecord.mime_type,
        fileRecord.name,
      );
    }

    // ---------- Process based on file type ----------
    let tags: string[] = [];
    let embedding: number[] | null = null;
    let embeddingModel = "";

    if (isImage) {
      // ===== IMAGE PIPELINE =====
      // Step 1: Combined description + tags in a single generative call
      let imageDescription = "";
      try {
        const combinedPrompt =
          `Describe the content of this image in detail, including any visible text, objects, scenes, and context.\n\nThen on a new line write exactly: TAGS: followed by a JSON array of 3 to 5 short descriptive tags.\n\nExample format:\nA photograph showing a mountain landscape with snow-capped peaks and a clear blue sky.\nTAGS: ["landscape", "mountains", "snow", "nature"]`;

        const combinedResult = await callGenerativeModel(
          geminiApiKey,
          combinedPrompt,
          {
            maxOutputTokens: 640,
            inlineData: inlineImageData,
          },
        );

        const { description, tags: parsedTags } = parseImageResponse(
          combinedResult.text,
        );
        imageDescription = description;
        tags = parsedTags;
      } catch (err) {
        console.error("Image description + tag generation failed:", err);
        // Continue — we'll still attempt embedding with whatever we have
      }

      // Step 2: Rate limit delay (2s between generative and embedding calls)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Generate embedding from the description text
      if (imageDescription) {
        try {
          const embResult = await callEmbeddingModel(
            geminiApiKey,
            imageDescription,
          );
          embedding = embResult.embedding;
          embeddingModel = embResult.model;
        } catch (err) {
          console.error("Image embedding generation failed:", err);
        }
      }
    } else {
      // ===== DOCUMENT PIPELINE =====
      // Step 1: Generate tags
      try {
        const tagPrompt =
          `Generate 3 to 5 short descriptive tags for this file named "${fileRecord.name}". Content:\n\n${(textContent || "").slice(0, 6000)}\n\nReturn only a JSON array of strings, no explanation. Example: ["invoice", "Q3", "finance"]`;

        const tagResult = await callGenerativeModel(geminiApiKey, tagPrompt, {
          maxOutputTokens: 128,
        });

        tags = parseTagsFromResponse(tagResult.text);
      } catch (err) {
        console.error("Tag generation failed:", err);
      }

      // Step 2: Rate limit delay (2s between tag and embedding calls)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Generate embedding from truncated text content
      try {
        const embeddingInput = (textContent || "").slice(0, 6000);

        if (embeddingInput.trim()) {
          const embResult = await callEmbeddingModel(
            geminiApiKey,
            embeddingInput,
          );
          embedding = embResult.embedding;
          embeddingModel = embResult.model;
        }
      } catch (err) {
        console.error("Embedding generation failed:", err);
      }
    }

    // ---------- Update ai_metadata ----------
    // Always store tags as an array (possibly empty) — never null.
    // null means "not yet processed"; [] means "processed but no tags found".
    const updatePayload: Record<string, unknown> = {
      file_id: fileRecord.id,
      tags,
      processing_status: "completed",
      processed_at: new Date().toISOString(),
      error_message: null,
    };

    if (embedding) {
      // Format embedding as pgvector string: [0.1,0.2,...]
      updatePayload.embedding = `[${embedding.join(",")}]`;
      updatePayload.embedding_model = embeddingModel;
    }

    const { error: updateError } = await supabase
      .from("ai_metadata")
      .upsert(updatePayload, { onConflict: "file_id" });

    if (updateError) {
      throw new Error(`Failed to update ai_metadata: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: "completed",
        fileId: fileRecord.id,
        tags,
        hasEmbedding: !!embedding,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errorMessage = (err as Error).message || "Unknown error";
    console.error("process-file-ai error:", errorMessage);

    // Update ai_metadata with failed status if we know the file ID
    if (fileId) {
      await markFailed(fileId, errorMessage);
    }

    // Always return 200 so webhook does not retry infinitely
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
