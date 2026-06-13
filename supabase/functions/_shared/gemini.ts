/**
 * Shared Gemini AI utility for Supabase Edge Functions.
 *
 * - Model fallback chain with exponential backoff
 * - Text extraction for documents
 * - Token truncation
 */

// ---------- Model chains ----------

export const GENERATIVE_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
];

export const EMBEDDING_MODELS = ["text-embedding-004"];

// ---------- Retry / backoff ----------

const MAX_RETRIES_PER_MODEL = 3;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 503;
}

// ---------- Generative model call ----------

interface GenerativeOptions {
  maxOutputTokens: number;
  /** Optional inline image data (base64) with mimeType */
  inlineData?: { mimeType: string; data: string };
}

export interface GenerativeResult {
  text: string;
  model: string;
}

/**
 * Call a Gemini generative model with automatic model fallback and exponential backoff.
 * Tries each model up to MAX_RETRIES_PER_MODEL times. Falls through to next model on 429/503.
 */
export async function callGenerativeModel(
  apiKey: string,
  prompt: string,
  options: GenerativeOptions,
): Promise<GenerativeResult> {
  let lastError = "";

  for (const model of GENERATIVE_MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const parts: Record<string, unknown>[] = [];

        if (options.inlineData) {
          parts.push({ inline_data: options.inlineData });
        }

        parts.push({ text: prompt });

        const body = {
          contents: [{ parts }],
          generationConfig: { maxOutputTokens: options.maxOutputTokens },
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          if (isRetryable(resp.status)) {
            const delayMs = 1000 * Math.pow(2, attempt);
            await delay(delayMs);
            continue; // retry same model
          }
          // Non-retryable error on this model → fall through
          lastError = `${model}: HTTP ${resp.status} ${await resp.text()}`;
          break;
        }

        const data = await resp.json();

        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

        if (!text) {
          lastError = `${model}: empty response`;
          break;
        }

        return { text, model };
      } catch (err) {
        lastError = `${model}: ${(err as Error).message}`;
        const delayMs = 1000 * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw new Error(`All generative models exhausted. Last error: ${lastError}`);
}

// ---------- Embedding model call ----------

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

/**
 * Generate an embedding vector for the given text.
 */
export async function callEmbeddingModel(
  apiKey: string,
  text: string,
): Promise<EmbeddingResult> {
  let lastError = "";

  for (const model of EMBEDDING_MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

        const body = {
          model: `models/${model}`,
          content: { parts: [{ text }] },
        };

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          if (isRetryable(resp.status)) {
            const delayMs = 1000 * Math.pow(2, attempt);
            await delay(delayMs);
            continue;
          }
          lastError = `${model}: HTTP ${resp.status} ${await resp.text()}`;
          break;
        }

        const data = await resp.json();
        const embedding = data?.embedding?.values;

        if (!embedding || !Array.isArray(embedding)) {
          lastError = `${model}: no embedding values in response`;
          break;
        }

        return { embedding, model };
      } catch (err) {
        lastError = `${model}: ${(err as Error).message}`;
        const delayMs = 1000 * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw new Error(`All embedding models exhausted. Last error: ${lastError}`);
}

// ---------- Token truncation ----------

/**
 * Truncate text to a maximum token estimate.
 * Rough estimate: 1 token ≈ 4 characters.
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number = 8000,
): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

// ---------- Text extraction ----------

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "html",
  "htm",
  "rtf",
  "log",
  "json",
  "xml",
  "yaml",
  "yml",
]);

/**
 * Extract text content from file bytes.
 * For simple text formats: decode as UTF-8.
 * For PDFs: attempt basic text extraction from text layer.
 * For binary docs (doc, docx): return filename as fallback.
 * Returns null if the file is an image (handled separately via inline_data).
 */
export function extractTextContent(
  bytes: Uint8Array,
  mimeType: string | null,
  fileName: string,
): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  // Images are processed differently (inline_data) — return null
  if (
    mimeType?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)
  ) {
    return null;
  }

  // Plain text formats
  if (
    TEXT_EXTENSIONS.has(ext) ||
    mimeType?.startsWith("text/") ||
    mimeType === "application/json"
  ) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  // PDF — extract text layer (simple approach: look for text between stream markers)
  if (ext === "pdf" || mimeType === "application/pdf") {
    return extractPdfText(bytes);
  }

  // For binary document formats (doc, docx, etc.), return filename as minimal context
  return `Document: ${fileName}`;
}

/**
 * Very basic PDF text extraction — pulls text from text objects.
 * This is lightweight and avoids heavy dependencies.
 */
function extractPdfText(bytes: Uint8Array): string {
  const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

  // Extract text from PDF text objects (Tj, TJ operators)
  const textParts: string[] = [];

  // Match parenthesized strings in text operators
  const regex = /\(([^)]*)\)/g;
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\\\/g, "\\")
      .replace(/\\([()])/g, "$1");
    if (cleaned.trim()) {
      textParts.push(cleaned);
    }
  }

  const extracted = textParts.join(" ").trim();
  return extracted || "PDF document (text extraction limited)";
}
