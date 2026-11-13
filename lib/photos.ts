/** Recipe photo rules, shared by the upload route and the photo picker. */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
/** Longest side, in pixels, that a photo is scaled down to before upload. */
export const MAX_PHOTO_DIMENSION = 2000;
