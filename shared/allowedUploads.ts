/** Extensions allowed for learner assignment submissions and admin-distributed handouts (also used for course lesson materials upload). */
export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".ppt",
  ".pptx",
  ".txt",
  ".rtf",
  ".odt",
  ".ods",
  ".odp",
  ".zip",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".tif",
  ".tiff",
  ".heic",
] as const;

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".rtf": "application/rtf",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".zip": "application/zip",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".heic": "image/heic",
};

const EXT_SET = new Set<string>(ALLOWED_UPLOAD_EXTENSIONS);

export function isAllowedUploadExtension(ext: string): boolean {
  const e = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return EXT_SET.has(e);
}

export function mimeFromExtension(ext: string): string {
  const e = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return EXT_TO_MIME[e] ?? "application/octet-stream";
}

/** For `<input type="file" accept={...} />` */
export const FILE_INPUT_ACCEPT_ATTR = ALLOWED_UPLOAD_EXTENSIONS.join(",");
