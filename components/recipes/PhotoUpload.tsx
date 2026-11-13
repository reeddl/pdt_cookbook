"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Spinner } from "@/components/ui/spinner";
import { MAX_PHOTO_BYTES, MAX_PHOTO_DIMENSION, PHOTO_TYPES } from "@/lib/photos";

/** An error whose message is already worded for the person picking the photo. */
class PhotoError extends Error {}

const ALREADY_SMALL_BYTES = 1.5 * 1024 * 1024;

/**
 * Phone photos are often too big (12+ MB) or in a format the store won't take
 * (HEIC). Scale anything large down to a sensible size and re-save it as JPEG,
 * so uploads stay well under the limit and recipe pages load fast. GIFs are
 * left alone to keep any animation.
 */
async function preparePhoto(file: File): Promise<File> {
  const allowed = (PHOTO_TYPES as readonly string[]).includes(file.type);
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (allowed) return file;
    throw new PhotoError("This browser can't read that photo's format. Try a JPEG or PNG.");
  }

  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (allowed && scale === 1 && file.size <= ALREADY_SMALL_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  // JPEG has no transparency; give see-through PNGs a white background, not black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

/** Ask the server why uploads are refused (store not set up, profile unfinished, ...). */
async function uploadBlockedReason(): Promise<string | null> {
  try {
    const res = await fetch("/api/blob/upload", { cache: "no-store" });
    const data = (await res.json()) as { ready?: boolean; reason?: string };
    return data.ready === false && data.reason ? data.reason : null;
  } catch {
    return null;
  }
}

interface PhotoUploadProps {
  name: string;
  defaultValue?: string | null;
}

export function PhotoUpload({ name, defaultValue }: PhotoUploadProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const photo = await preparePhoto(file);
      if (photo.size > MAX_PHOTO_BYTES) {
        throw new PhotoError(
          `That photo is ${(photo.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`
        );
      }
      const blob = await upload(photo.name, photo, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      setUrl(blob.url);
    } catch (err) {
      console.error("Photo upload failed:", err);
      if (err instanceof PhotoError) {
        setError(err.message);
      } else {
        const reason = await uploadBlockedReason();
        const detail = err instanceof Error ? err.message.replace(/^Vercel Blob:\s*/, "") : "";
        setError(reason ?? `Upload failed${detail ? `: ${detail}` : ""}. Please try again.`);
      }
    } finally {
      setUploading(false);
      // Let the same file be picked again after a failure.
      e.target.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Recipe photo preview"
          className="mb-2 h-40 w-full rounded-2lg object-cover"
        />
      )}
      <label className="inline-block">
        <span className="sr-only">Choose photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-body-regular text-text-secondary file:mr-3 file:rounded-2lg file:border-0 file:bg-background-secondary-default file:px-3 file:py-2 file:text-body-regular file:font-medium file:text-text-primary hover:file:bg-background-tertiary-default disabled:opacity-50"
        />
      </label>
      {uploading && (
        <p className="mt-1 flex items-center gap-1.5 text-caption-1-regular text-text-secondary">
          <Spinner className="h-3 w-3" />
          Uploading…
        </p>
      )}
      {error && <p className="mt-1 text-caption-1-regular text-text-error-primary">{error}</p>}
    </div>
  );
}
