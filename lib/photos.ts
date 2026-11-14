/** Recipe photo rules, shared by the upload route and the photo picker. */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
/** Photos go through the site's server, and Vercel caps a request at 4.5 MB. */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
/** Longest side, in pixels, that a photo is scaled down to before upload. */
export const MAX_PHOTO_DIMENSION = 2000;
