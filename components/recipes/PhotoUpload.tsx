"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Spinner } from "@/components/ui/spinner";

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
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      setUrl(blob.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
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
          accept="image/png,image/jpeg,image/webp,image/gif"
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
