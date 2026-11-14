/**
 * Checks the Vercel Blob read-write key (BLOB_READ_WRITE_TOKEN) for the
 * mistakes that make Vercel answer "Access denied" without saying why.
 *
 * A key looks like vercel_blob_rw_<storeId>_<secret>. The Blob library signs
 * upload tokens with the whole string, so a pasted key that kept its quotes
 * or picked up a line break produces signatures Vercel rejects.
 */
export interface BlobTokenCheck {
  /** The key with stray quotes and whitespace removed, or null if unset. */
  token: string | null;
  /** The store the key belongs to, read from the key itself. */
  storeId: string | null;
  /** Plain-words problems found, empty when the key looks right. */
  problems: string[];
}

const PREFIX = "vercel_blob_rw_";

export function inspectBlobToken(raw: string | undefined | null): BlobTokenCheck {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return { token: null, storeId: null, problems: ["BLOB_READ_WRITE_TOKEN is not set."] };
  }

  const problems: string[] = [];
  let token = raw;

  if (token !== token.trim()) {
    problems.push("BLOB_READ_WRITE_TOKEN has spaces or line breaks around it.");
    token = token.trim();
  }
  const quoted = /^(["'`])([\s\S]*)\1$/.exec(token);
  if (quoted) {
    problems.push("BLOB_READ_WRITE_TOKEN was saved with quotes around it.");
    token = quoted[2].trim();
  }
  if (/\s/.test(token)) {
    problems.push("BLOB_READ_WRITE_TOKEN has a space or line break inside it.");
    token = token.replace(/\s+/g, "");
  }

  let storeId: string | null = null;
  if (!token.startsWith(PREFIX)) {
    problems.push(
      token.startsWith("vercel_blob_")
        ? "BLOB_READ_WRITE_TOKEN is a different kind of Blob key; it needs the read-write one (vercel_blob_rw_…)."
        : "BLOB_READ_WRITE_TOKEN doesn't look like a Vercel Blob key (it should start with vercel_blob_rw_)."
    );
  } else {
    const [id, ...secret] = token.slice(PREFIX.length).split("_");
    if (!id || secret.join("_") === "") {
      problems.push("BLOB_READ_WRITE_TOKEN looks cut short; copy the whole key again.");
    } else {
      storeId = id;
    }
  }

  return { token, storeId, problems };
}
