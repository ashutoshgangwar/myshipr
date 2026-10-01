
export type DocumentCategory = 'receipt' | 'pod';
export interface DocumentUploadParams {
  /** Base64 bytes of the image, with no `data:` prefix. */
  content: string;
  /** The name the document is stored under, extension included. */
  filename?: string;
  /** MIME type of `content`. */
  contentType?: string;
  documentCategory?: DocumentCategory;
  runExtraction?: boolean;

  orgId?: string;
}


export interface DocumentUploadResult {
  id?: string;
  filename?: string;
  documentCategory?: string;
  [key: string]: unknown;
}
