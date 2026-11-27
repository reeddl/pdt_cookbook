import { del, put } from "@vercel/blob";
import { inspectBlobToken } from "./token";

/**
 * How this deployment talks to its Vercel Blob store.
 *
 * Vercel can connect a store two ways: a read-write key (BLOB_READ_WRITE_TOKEN),
 * or the project's own sign-in (OIDC) plus BLOB_STORE_ID. When BLOB_STORE_ID is
 * set we leave the key out and let the Blob library use OIDC, which never goes
 * stale. Otherwise we pass the key ourselves, cleaned of pasted quotes.
 */
export function blobAuth(): { configured: boolean; token?: string; usesOidc: boolean } {
  if (process.env.BLOB_STORE_ID?.trim()) return { configured: true, usesOidc: true };
  const { token } = inspectBlobToken(process.env.BLOB_READ_WRITE_TOKEN);
  return token ? { configured: true, token, usesOidc: false } : { configured: false, usesOidc: false };
}

export interface BlobSetupReport {
  ok: boolean;
  /** One plain sentence on what's wrong, or that it works. */
  summary: string;
  usesOidc: boolean;
  /** Which Blob settings exist on this deployment (names only, never values). */
  settings: Record<string, boolean>;
  /** The store id from the key, so it can be matched against Vercel's Storage tab. */
  storeIdFromKey: string | null;
  keyProblems: string[];
  /** What Vercel said when we tried to save a tiny test file. */
  testUpload: { ok: boolean; status?: number; code?: string; message?: string };
}

const API_URL = process.env.VERCEL_BLOB_API_URL || "https://vercel.com/api/blob";

/**
 * Saves and deletes a tiny public test file, keeping Vercel's own error words.
 * The Blob library hides them behind "Access denied", so with a key we call
 * the API directly; with OIDC we can only report the library's error.
 */
async function tryTestUpload(
  token: string | undefined,
  storeId: string | null
): Promise<BlobSetupReport["testUpload"]> {
  const pathname = `_setup-check/${Date.now()}.txt`;
  if (!token) {
    try {
      const blob = await put(pathname, "ok", { access: "public", addRandomSuffix: true });
      await del(blob.url).catch(() => {});
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        code: error instanceof Error ? error.name : undefined,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  try {
    const res = await fetch(`${API_URL}/?${new URLSearchParams({ pathname })}`, {
      method: "PUT",
      body: "ok",
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": "12",
        "x-vercel-blob-access": "public",
        "x-add-random-suffix": "1",
        "x-content-type": "text/plain",
        ...(storeId ? { "x-vercel-blob-store-id": storeId } : {}),
      },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as
      | { url?: string; error?: { code?: string; message?: string } }
      | null;
    if (res.ok && data?.url) {
      await del(data.url, { token }).catch(() => {});
      return { ok: true, status: res.status };
    }
    return { ok: false, status: res.status, code: data?.error?.code, message: data?.error?.message };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function explain(report: Omit<BlobSetupReport, "summary" | "ok">): string {
  const { testUpload: t, keyProblems, settings, usesOidc } = report;
  if (t.ok) {
    return keyProblems.length
      ? "Uploads work, but the key needs tidying in Vercel: " + keyProblems.join(" ")
      : "Uploads work.";
  }
  if (!settings.BLOB_READ_WRITE_TOKEN && !usesOidc) {
    return "No Blob store is connected to this deployment. Connect one in Vercel's Storage tab and redeploy.";
  }
  const words = `${t.code ?? ""} ${t.message ?? ""}`.toLowerCase();
  if (words.includes("private")) {
    return "The Blob store is private, but recipe photos have to be public. Connect a public Blob store instead.";
  }
  if (words.includes("suspended")) return "Vercel has suspended this Blob store.";
  if (words.includes("not_found") || words.includes("not found")) {
    return "The Blob store this key belongs to no longer exists. Connect a store again and redeploy.";
  }
  if (t.status === 403 || words.includes("forbidden") || words.includes("access")) {
    return keyProblems.length
      ? "Vercel refused the key. " + keyProblems.join(" ")
      : "Vercel refused the key: it's out of date or belongs to another store. Copy the current BLOB_READ_WRITE_TOKEN from the store's page in Vercel, or reconnect the store, then redeploy.";
  }
  return "Vercel wouldn't save a test file. Its answer is below.";
}

/** Run by an admin to see exactly why photo uploads fail on this deployment. */
export async function checkBlobSetup(): Promise<BlobSetupReport> {
  const auth = blobAuth();
  const key = inspectBlobToken(process.env.BLOB_READ_WRITE_TOKEN);
  const base = {
    usesOidc: auth.usesOidc,
    settings: {
      BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
      BLOB_STORE_ID: Boolean(process.env.BLOB_STORE_ID?.trim()),
      VERCEL_BLOB_API_URL: Boolean(process.env.VERCEL_BLOB_API_URL),
    },
    storeIdFromKey: key.storeId,
    keyProblems: process.env.BLOB_READ_WRITE_TOKEN?.trim() ? key.problems : [],
  };
  const testUpload = auth.configured
    ? await tryTestUpload(auth.token, key.storeId)
    : { ok: false, message: "No Blob settings found." };
  const report = { ...base, testUpload };
  return { ok: testUpload.ok, summary: explain(report), ...report };
}
