"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

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
          className="mb-2 h-40 w-full rounded-lg object-cover"
        />
      )}
      <label className="inline-block">
        <span className="sr-only">Choose photo</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          className="block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sidebar file:px-3 file:py-2 file:text-sm file:font-medium file:text-text hover:file:bg-border"
        />
      </label>
      {uploading && <p className="mt-1 text-xs text-text-muted">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
