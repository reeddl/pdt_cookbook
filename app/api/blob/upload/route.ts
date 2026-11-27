import { BlobAccessError, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isProfileComplete } from "@/lib/authz";
import { PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/photos";
import { blobAuth, checkBlobSetup } from "@/lib/blob/setup";

/**
 * Why the signed-in user can't upload a photo right now, or null if they can.
 * Admins can upload without a finished profile, because they add and edit
 * recipes from the admin pages, which don't ask for one.
 */
async function uploadBlocker(): Promise<{ status: number; message: string; isAdmin?: boolean } | null> {
  const session = await auth();
  if (!session || session.user.status !== "APPROVED") {
    return { status: 401, message: "Sign in with an approved account to upload photos." };
  }
  const isAdmin = session.user.role === "ADMIN";
  if (!blobAuth().configured) {
    console.error("Photo upload refused: no Vercel Blob store is connected (BLOB_READ_WRITE_TOKEN and BLOB_STORE_ID are unset)");
    return {
      status: 503,
      message: "Photo uploads aren't set up on this site yet (no Vercel Blob store is connected).",
      isAdmin,
    };
  }
  if (!isAdmin && !(await isProfileComplete(session.user.id))) {
    return {
      status: 403,
      message: "Add your bond number, pledge class and graduation year to your profile before uploading photos.",
    };
  }
  return null;
}

async function isSignedInAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user.status === "APPROVED" && session.user.role === "ADMIN";
}

/**
 * GET explains a refused upload in plain words for the photo picker.
 * GET ?check=1, for admins only, saves and deletes a tiny test file and reports
 * what Vercel says, so a broken Blob setup can be fixed without guessing.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (new URL(request.url).searchParams.get("check")) {
    if (!(await isSignedInAdmin())) {
      return NextResponse.json({ error: "Only admins can run the photo setup check." }, { status: 403 });
    }
    return NextResponse.json(await checkBlobSetup(), { headers: { "cache-control": "no-store" } });
  }
  const blocker = await uploadBlocker();
  return NextResponse.json(blocker ? { ready: false, reason: blocker.message } : { ready: true });
}

const SETUP_CHECK_HINT = "An admin can open /api/blob/upload?check=1 to see why.";

/**
 * Saves one recipe photo to the Blob store and returns its public URL.
 *
 * The photo comes through this server rather than straight from the browser to
 * Vercel. That way Vercel's answer lands in our logs instead of only in the
 * browser, and the store can be reached with the project's own sign-in (OIDC)
 * when BLOB_STORE_ID is set. The photo picker shrinks photos first, so they fit
 * under Vercel's 4.5 MB request limit.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const blocker = await uploadBlocker();
  if (blocker) return NextResponse.json({ error: blocker.message }, { status: blocker.status });

  let file: File;
  try {
    const entry = (await request.formData()).get("file");
    if (!(entry instanceof File)) throw new Error("no file");
    file = entry;
  } catch {
    return NextResponse.json({ error: "No photo was sent." }, { status: 400 });
  }
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Photos must be JPEG, PNG, WebP or GIF." }, { status: 415 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: `That photo is too big. The limit is ${MAX_PHOTO_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  const name = (file.name || "photo").replace(/[^\w.-]+/g, "-").slice(-80) || "photo";
  try {
    const blob = await put(`recipes/${name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      token: blobAuth().token,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Photo upload to Vercel Blob failed:", error);
    const message =
      error instanceof BlobAccessError
        ? `Vercel refused this site's photo storage key, so the photo wasn't saved. ${SETUP_CHECK_HINT}`
        : `The photo couldn't be saved (${error instanceof Error ? error.message.replace(/^Vercel Blob:\s*/, "") : "unknown error"}). ${SETUP_CHECK_HINT}`;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
