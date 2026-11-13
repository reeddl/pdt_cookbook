import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isProfileComplete } from "@/lib/authz";
import { PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/photos";

/**
 * Why the signed-in user can't upload a photo right now, or null if they can.
 * Admins can upload without a finished profile, because they add and edit
 * recipes from the admin pages, which don't ask for one.
 */
async function uploadBlocker(): Promise<{ status: number; message: string } | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Photo upload refused: BLOB_READ_WRITE_TOKEN is not set for this deployment");
    return {
      status: 503,
      message: "Photo uploads aren't set up on this site yet (no Vercel Blob store is connected).",
    };
  }
  const session = await auth();
  if (!session || session.user.status !== "APPROVED") {
    return { status: 401, message: "Sign in with an approved account to upload photos." };
  }
  if (session.user.role !== "ADMIN" && !(await isProfileComplete(session.user.id))) {
    return {
      status: 403,
      message: "Add your bond number, pledge class and graduation year to your profile before uploading photos.",
    };
  }
  return null;
}

/** Lets the photo picker explain a failed upload in plain words. */
export async function GET(): Promise<NextResponse> {
  const blocker = await uploadBlocker();
  return NextResponse.json(blocker ? { ready: false, reason: blocker.message } : { ready: true });
}

export async function POST(request: Request): Promise<NextResponse> {
  const blocker = await uploadBlocker();
  if (blocker) return NextResponse.json({ error: blocker.message }, { status: blocker.status });

  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...PHOTO_TYPES],
        maximumSizeInBytes: MAX_PHOTO_BYTES,
        addRandomSuffix: true,
      }),
      // No onUploadCompleted: the recipe form saves the returned URL itself, and a
      // completion callback would only be bounced to /login by the sign-in gate.
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Photo upload token request failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
