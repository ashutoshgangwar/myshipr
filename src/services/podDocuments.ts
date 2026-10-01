import {useCallback, useRef, useState} from 'react';
import {Image as ImageCompressor} from 'react-native-compressor';

import {uploadDocument} from '../config/documentApi';
import {submitDeliveryStopProof} from '../config/driverApi';
import {createApiLogger} from '../config/api';
import type {DocumentCategory, DocumentUploadResult} from '../types/document';
import type {DeliveryProofResult, DeliveryProofType} from '../types/shipment';
import type {ApiErrorBody} from '../types/api';
import type {ErrorLike, Nullable} from '../types/common';
import type {AxiosError} from 'axios';

const log = createApiLogger('[PodDocuments]');

/** A rejected field, as the document service lists them. */
interface FieldError {
  field?: string;
  message?: string;
}

/**
 * Why the service turned the upload down, in its own words.
 *
 * It does not answer in the gateway's `message` envelope — a rejection reads
 * `{error, fields:[{field, message}]}` — so the field-level line is preferred
 * and `error` is the fallback.
 */
const failureText = (body: (ApiErrorBody & {fields?: FieldError[]}) | undefined):
  | string
  | undefined => {
  const field = body?.fields?.find(f => f?.message)?.message;
  return field || body?.message || body?.error;
};

/** Which of the POD sheet's two photos is being filed. */
export type PodDocumentKind = 'receipt' | 'goods';

/**
 * How each photo is filed: what the document service stores it as, and what
 * the stop's proof calls it.
 *
 * The categories are the service's own — it validates them against its list
 * and turns down anything else as an unknown document type, which is why the
 * receipt is `receipt` rather than `receipt_photo`.
 */
const POD_DOCUMENTS: Record<
  PodDocumentKind,
  {
    filename: string;
    contentType: string;
    category: DocumentCategory;
    proofType: DeliveryProofType;
    /** Shown on the sheet when neither call says why it failed. */
    error: string;
  }
> = {
  receipt: {
    filename: 'signed_receipt.jpeg',
    contentType: 'image/jpeg',
    category: 'receipt',
    proofType: 'RECEIPT',
    error: 'Could not upload the receipt. Please try again.',
  },
  goods: {
    filename: 'delivered_goods.jpeg',
    contentType: 'image/jpeg',
    category: 'pod',
    proofType: 'DELIVERED_GOODS',
    error: 'Could not upload the photo. Please try again.',
  },
};

/** The stop a photo is filed against — the proof call's path parts. */
export interface DeliveryStopTarget {
  shipmentId: string;
  sequence: number;
}

/** Both halves of a filed photo: the stored document, then its proof. */
export interface FiledDocument {
  document: DocumentUploadResult;
  /** null when the sheet was opened without a stop to file against. */
  proof: Nullable<DeliveryProofResult>;
}

/**
 * A photo off the camera is several megabytes; base64 inflates it by a third
 * again, and the whole thing travels as a JSON string. Resizing to something
 * a receipt is still legible at keeps the request a sane size — and the
 * service's extraction reads it just as well.
 */
const MAX_EDGE = 1600;
const QUALITY = 0.8;

/**
 * Base64 bytes of the photo at `uri`, resized and re-encoded as JPEG.
 *
 * The native side returns bare base64, but a `data:` prefix would poison the
 * payload, so one is stripped if it ever shows up.
 */
export const readPhotoAsBase64 = async (uri: string): Promise<string> => {
  const encoded = await ImageCompressor.compress(uri, {
    compressionMethod: 'manual',
    maxWidth: MAX_EDGE,
    maxHeight: MAX_EDGE,
    quality: QUALITY,
    output: 'jpg',
    returnableOutputType: 'base64',
  });
  return String(encoded).replace(/^data:[^;]+;base64,/, '');
};

/**
 * Files one of the POD photos with the document service.
 *
 * The org the document is filed against comes from the login response, by way
 * of `getOrganizationId()` inside `uploadDocument`.
 */
export const uploadPodPhoto = async (
  uri: string,
  kind: PodDocumentKind,
): Promise<DocumentUploadResult> => {
  const {filename, contentType, category} = POD_DOCUMENTS[kind];
  const content = await readPhotoAsBase64(uri);
  return uploadDocument({
    content,
    filename,
    contentType,
    documentCategory: category,
    runExtraction: true,
  });
};

/**
 * One POD photo step: encode the shot, file it with the document service,
 * then register the stored document against the stop as a proof of delivery.
 *
 * The two go together — the proof is nothing but the document's id, so it is
 * sent only once the upload has answered with one, and the step only moves on
 * when both have landed.
 *
 * Both answers are kept rather than only logged: the Location and Load the
 * sheet shows are hard-coded for now, and the document's extraction block is
 * what will fill them in.
 *
 * @param kind which photo this is — it decides the filename, the category the
 *   document is stored under and the type its proof is filed as
 */
export function usePodDocumentUpload(kind: PodDocumentKind) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Nullable<string>>(null);
  const [result, setResult] = useState<Nullable<FiledDocument>>(null);
  // Bumped on every reset, so an upload still in flight cannot report into a
  // sheet that has since been closed and reopened.
  const runIdRef = useRef(0);
  // The document already stored for a given shot. A proof that fails leaves a
  // perfectly good document behind it, so a retry files the proof again
  // rather than uploading the same photo a second time.
  const storedRef = useRef<Nullable<{uri: string; document: DocumentUploadResult}>>(
    null,
  );

  const reset = useCallback(() => {
    ++runIdRef.current;
    storedRef.current = null;
    setUploading(false);
    setError(null);
    setResult(null);
  }, []);

  const upload = useCallback(
    async (
      uri: string,
      target?: Nullable<DeliveryStopTarget>,
      capturedAt?: string,
    ): Promise<Nullable<FiledDocument>> => {
      const runId = ++runIdRef.current;
      setUploading(true);
      setError(null);
      try {
        const cached =
          storedRef.current?.uri === uri ? storedRef.current.document : null;
        const document = cached ?? (await uploadPodPhoto(uri, kind));
        if (!cached) {
          console.log(`[PodDocuments] ${kind} document response`, document);
          storedRef.current = {uri, document};
        }

        // No stop to file against — the sheet was opened from "End Trip" with
        // every stop already cleared. The document is stored either way.
        let proof: Nullable<DeliveryProofResult> = null;
        if (target && document?.id) {
          proof = await submitDeliveryStopProof({
            ...target,
            type: POD_DOCUMENTS[kind].proofType,
            docId: String(document.id),
            capturedAt,
          });
          console.log(`[PodDocuments] ${kind} proof response`, proof);
        } else if (target) {
          log(`${kind}: no document id came back — proof not filed`, document);
        }

        if (runId !== runIdRef.current) return null;
        const filed = {document, proof};
        setResult(filed);
        return filed;
      } catch (e) {
        const err = e as AxiosError<ApiErrorBody & {fields?: FieldError[]}> &
          ErrorLike;
        log(`${kind} upload failed`, err?.response?.data ?? err?.message);
        if (runId === runIdRef.current) {
          setError(
            failureText(err?.response?.data) ||
              err?.message ||
              POD_DOCUMENTS[kind].error,
          );
        }
        return null;
      } finally {
        if (runId === runIdRef.current) setUploading(false);
      }
    },
    [kind],
  );

  return {uploading, error, result, upload, reset};
}
