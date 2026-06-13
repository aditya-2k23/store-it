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
          "First, describe the content of this image in detail, including any visible text, objects, scenes, and context. Then on a new line output TAGS: followed by a JSON array of 3 to 5 short descriptive tags.";

        const combinedResult = await callGenerativeModel(
          geminiApiKey,
          combinedPrompt,
          {
            maxOutputTokens: 640,
            inlineData: inlineImageData,
          },
        );

        // Parse response: split on "TAGS:" — description before, tags after
        const tagsMarkerIdx = combinedResult.text.indexOf("TAGS:");
        if (tagsMarkerIdx !== -1) {
          imageDescription = combinedResult.text
            .slice(0, tagsMarkerIdx)
            .trim();
          const tagsJsonStr = combinedResult.text.slice(tagsMarkerIdx + 5);
          const jsonMatch = tagsJsonStr.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
              tags = parsed
                .filter((t: unknown) => typeof t === "string")
                .slice(0, 5);
            }
          }
        } else {
          // Model didn't follow format — use full response as description
          imageDescription = combinedResult.text;
        }
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
        const tagPrompt = `Generate 3 to 5 short descriptive tags for this file named "${fileRecord.name}". Content:\n\n${(textContent || "").slice(0, 6000)}\n\nReturn only a JSON array of strings, no explanation. Example: ["invoice", "Q3", "finance"]`;

        const tagResult = await callGenerativeModel(geminiApiKey, tagPrompt, {
          maxOutputTokens: 128,
        });

        const jsonMatch = tagResult.text.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            tags = parsed
              .filter((t: unknown) => typeof t === "string")
              .slice(0, 5);
          }
        }
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
    const updatePayload: Record<string, unknown> = {
      file_id: fileRecord.id,
      tags: tags.length > 0 ? tags : null,
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
