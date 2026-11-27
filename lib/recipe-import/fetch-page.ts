
import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";
import zlib from "node:zlib";
import type { LookupFunction } from "node:net";

/**
 * Fetches a public web page's HTML for the recipe importer, server-side.
 *
 * Because the server fetches whatever link a member pastes, it guards against
 * being pointed at internal services: http/https only, standard ports only,
 * and every address the hostname resolves to (checked at connect time, so a
 * DNS answer can't change between check and use) must be a public one.
 * Redirects are followed by hand and each hop is checked the same way.
 */

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 4;

export class FetchPageError extends Error {
  constructor(
    public readonly code: "invalid-url" | "blocked" | "timeout" | "http" | "not-html" | "too-large" | "network",
    message: string
  ) {
    super(message);
  }
}

export function normalizeUrl(input: string): URL {
  let raw = input.trim();
  if (!raw) throw new FetchPageError("invalid-url", "Paste a link to a recipe page.");
  // "example.com/pie" or "example.com:443/pie" get https:// added; real schemes are kept so they can be refused.
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && !/^(javascript|data|file|mailto|about|blob|vbscript):/i.test(raw)) {
    raw = `https://${raw}`;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchPageError("invalid-url", "That doesn't look like a web link.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchPageError("invalid-url", "Only http and https links can be imported.");
  }
  if (url.username || url.password) {
    throw new FetchPageError("invalid-url", "Links with a username or password can't be imported.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new FetchPageError("blocked", "That link can't be imported.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new FetchPageError("blocked", "That link can't be imported.");
  }
  if (net.isIP(host) && !isPublicAddress(host)) {
    throw new FetchPageError("blocked", "That link can't be imported.");
  }
  url.hash = "";
  return url;
}

/** True only for globally routable unicast addresses. */
export function isPublicAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b, c] = address.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
    if (a === 169 && b === 254) return false; // link-local, cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a === 198 && b === 51 && c === 100) return false;
    if (a === 203 && b === 0 && c === 113) return false;
    if (a >= 224) return false; // multicast, reserved, broadcast
    return true;
  }
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicAddress(mapped[1]);
    if (lower === "::" || lower === "::1") return false;
    const first = parseInt(lower.split(":")[0] || "0", 16);
    if ((first & 0xfe00) === 0xfc00) return false; // unique local fc00::/7
    if ((first & 0xffc0) === 0xfe80) return false; // link-local fe80::/10
    if ((first & 0xff00) === 0xff00) return false; // multicast
    if (lower.startsWith("64:ff9b:") || lower.startsWith("2001:db8:") || lower.startsWith("::ffff:")) return false;
    return (first & 0xe000) === 0x2000; // global unicast 2000::/3
  }
  return false;
}

/** DNS lookup that refuses non-public answers, used at connect time. */
export const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    const list = addresses as dns.LookupAddress[];
    const bad = list.find((a) => !isPublicAddress(a.address));
    if (!list.length || bad) {
      const e = new FetchPageError("blocked", "That link can't be imported.") as Error & { code: string };
      return callback(e as NodeJS.ErrnoException, "", 4);
    }
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

interface RawResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

function requestOnce(url: URL, deadline: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new FetchPageError("timeout", "The page took too long to load."));

    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.8",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, headers: res.headers, body: Buffer.alloc(0) });
        }
        const declared = Number(res.headers["content-length"] ?? 0);
        if (declared > MAX_BYTES) {
          res.destroy();
          return reject(new FetchPageError("too-large", "That page is too large to import."));
        }

        let stream: NodeJS.ReadableStream = res;
        const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
        if (enc === "gzip" || enc === "x-gzip") stream = res.pipe(zlib.createGunzip());
        else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
        else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());

        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            res.destroy();
            reject(new FetchPageError("too-large", "That page is too large to import."));
            return;
          }
          chunks.push(chunk);
        });
        stream.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks) }));
        stream.on("error", (e) => reject(e));
      }
    );

    req.setTimeout(remaining, () => {
      req.destroy(new FetchPageError("timeout", "The page took too long to load."));
    });
    req.on("error", (e) => {
      if (e instanceof FetchPageError) return reject(e);
      const cause = (e as { cause?: unknown }).cause;
      if (cause instanceof FetchPageError) return reject(cause);
      reject(new FetchPageError("network", "Couldn't reach that page."));
    });
    req.end();
  });
}

/** Returns the page's HTML as text. Throws FetchPageError with a member-friendly message. */
export async function fetchPageHtml(input: string): Promise<{ html: string; finalUrl: string }> {
  let url = normalizeUrl(input);
  const deadline = Date.now() + TIMEOUT_MS;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await requestOnce(url, deadline);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.location;
      if (!location) throw new FetchPageError("http", "The page redirected somewhere we couldn't follow.");
      url = normalizeUrl(new URL(location, url).toString());
      continue;
    }
    if (res.status === 401 || res.status === 403) {
      throw new FetchPageError("http", "That site didn't let us read the page. Try entering the recipe by hand.");
    }
    if (res.status === 404) throw new FetchPageError("http", "That page wasn't found. Check the link.");
    if (res.status < 200 || res.status >= 300) {
      throw new FetchPageError("http", `That site returned an error (${res.status}).`);
    }

    const type = String(res.headers["content-type"] ?? "").toLowerCase();
    if (type && !type.includes("html") && !type.includes("xml")) {
      throw new FetchPageError("not-html", "That link isn't a web page.");
    }

    const charset = type.match(/charset=([\w-]+)/)?.[1] ?? "utf-8";
    let html: string;
    try {
      html = new TextDecoder(charset).decode(res.body);
    } catch {
      html = new TextDecoder("utf-8").decode(res.body);
    }
    return { html, finalUrl: url.toString() };
  }

  throw new FetchPageError("http", "The page redirected too many times.");
}
