import type {AxiosError} from 'axios';

import apiClient, {
  BASE_URL,
  createApiLogger,
  getOrganizationId,
} from './api';
import type {ApiErrorBody} from '../types/api';
import type {ErrorLike} from '../types/common';
import type {
  DocumentUploadParams,
  DocumentUploadResult,
} from '../types/document';

type DocumentApiError = AxiosError<ApiErrorBody> & ErrorLike;

const log = createApiLogger('[DocumentAPI]');

/**
 * The blob service sits beside the driver API on the same gateway but is
 * versioned `/v1` rather than `/api/v1`, so `serviceUrl()` cannot build this
 * one.
 */
export const DOCUMENT_ENDPOINTS = {
  upload: () => `${BASE_URL}/face-blob-service/v1/documents`,
};

/** How much of the base64 payload goes in the log line. */
const CONTENT_LOG_CHARS = 32;

/**
 * An image travels as base64 inside the JSON body, so this request is far
 * bigger than the rest of the app's — the shared 30s is not enough of a
 * margin for it on a cell link.
 */
const UPLOAD_TIMEOUT_MS = 90000;

/**
 * Files a base64 image with the document service.
 *
 * `orgId` defaults to the organization stored at login — the id the service
 * files the document under, and without which it has nothing to attach it to.
 *
 * @returns the stored document, extraction block included when the service
 *          ran one
 */
export const uploadDocument = async ({
  content,
  filename = 'document.jpeg',
  contentType = 'image/jpeg',
  documentCategory = 'receipt',
  runExtraction = true,
  orgId,
}: DocumentUploadParams): Promise<DocumentUploadResult> => {
  if (!content) {
    throw new Error('uploadDocument: content (base64) is required');
  }

  const organizationId = orgId ?? (await getOrganizationId());
  if (!organizationId) {
    throw new Error('uploadDocument: no organization id — is anyone signed in?');
  }

  const url = DOCUMENT_ENDPOINTS.upload();
  const payload = {
    org_id: organizationId,
    filename,
    content_type: contentType,
    content,
    document_category: documentCategory,
    run_extraction: runExtraction,
  };

  // The base64 itself is megabytes long — log its size and opening bytes
  // instead, which is all that is wanted to tell one upload from another.
  log('document upload request', {
    ...payload,
    content: `${content.slice(0, CONTENT_LOG_CHARS)}… (${content.length} chars)`,
  });

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, payload, {
      timeout: UPLOAD_TIMEOUT_MS,
    }));
  } catch (e) {
    const err = e as DocumentApiError;
    log('document upload failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`document upload response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body ?? {};
};
