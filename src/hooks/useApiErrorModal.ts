import {useCallback, useMemo, useState} from 'react';

import type {ApiErrorBody} from '../types/api';

/** Anything `showApiError` accepts. */
export type ShowableApiError =
  | string
  | (Error & {response?: {data?: ApiErrorBody}})
  | null
  | undefined;

/**
 * A failure reduced to display copy, plus the original for anything that
 * wants to inspect it. `raw` is absent when the caller passed a bare string —
 * there was no error object to keep.
 */
export interface NormalizedApiError {
  message: string;
  raw?: unknown;
}

const normalizeError = (
  error: ShowableApiError,
): NormalizedApiError | null => {
  if (!error) return null;

  if (typeof error === 'string') {
    return {message: error};
  }

  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Unable to complete your request. Please try again.';

  return {message, raw: error};
};

const useApiErrorModal = () => {
  const [apiError, setApiError] = useState<NormalizedApiError | null>(null);

  const showApiError = useCallback((error: ShowableApiError) => {
    setApiError(normalizeError(error));
  }, []);

  const hideApiError = useCallback(() => {
    setApiError(null);
  }, []);

  const modalProps = useMemo(
    () => ({
      visible: Boolean(apiError),
      error: apiError?.raw || apiError?.message,
      message: apiError?.message,
      onClose: hideApiError,
    }),
    [apiError, hideApiError],
  );

  return {
    apiError,
    showApiError,
    hideApiError,
    modalProps,
  };
};

export default useApiErrorModal;
