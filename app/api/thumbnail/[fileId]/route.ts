import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { fileId } = await params;
    const supabase = createSupabaseAdmin();

    // Resolve the current user's DB id and email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("clerk_id", clerkId)
      .single();

    if (userError || !user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Fetch the file record
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("storage_key, owner_id, type")
      .eq("id", fileId)
      .eq("is_trashed", false)
      .single();

    if (fileError || !file) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Verify ownership or shared access
    let hasAccess = file.owner_id === user.id;
    if (!hasAccess) {
      const { data: share } = await supabase
        .from("direct_file_shares")
        .select("file_id")
        .eq("file_id", fileId)
        .eq("shared_with_email", user.email.toLowerCase())
        .maybeSingle();
      hasAccess = !!share;
    }

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (file.type !== "image") {
      return new NextResponse("Not an image file", { status: 400 });
    }

    // Generate a short-lived signed URL for the internal fetch only
    const { data: signedData, error: signedError } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
      .createSignedUrl(file.storage_key, 120); // 2 min — only needed for this request

    if (signedError || !signedData?.signedUrl) {
      return new NextResponse("Failed to generate signed URL", { status: 502 });
    }

    // Fetch the original image from Supabase storage
    const imageRes = await fetch(signedData.signedUrl);
    if (!imageRes.ok) {
      return new NextResponse("Failed to fetch image from storage", {
        status: 502,
      });
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // Resize and compress with sharp (free, built into Next.js ecosystem)
    const sharp = (await import("sharp")).default;
    const thumbnail = await sharp(imageBuffer)
      .resize(200, 200, { fit: "cover", position: "centre" })
      .webp({ quality: 60 })
      .toBuffer();

    return new NextResponse(new Uint8Array(thumbnail), {
      headers: {
        "Content-Type": "image/webp",
        // 24h browser cache + 1h stale-while-revalidate
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[thumbnail] Unexpected error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
