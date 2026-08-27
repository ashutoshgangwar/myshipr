import {useCallback, useMemo, useState} from 'react';

import type {ApiErrorBody} from '../types/api';

/** What an error modal can be told to show. */
export interface ErrorModalConfig {
  title?: string;
  message?: string;
  variant?: 'error' | 'success' | 'warning' | 'info';
  confirmText?: string;
  closeText?: string;
  dismissable?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
}

/**
 * Anything `showError` accepts: a ready-made string, an axios failure, or a
 * plain Error. `extractMessage` walks all three.
 */
export type ShowableError =
  | string
  | (Error & {response?: {data?: ApiErrorBody}})
  | null
  | undefined;

const DEFAULT_MESSAGE = 'Unable to complete your request. Please try again.';

const extractMessage = (error: ShowableError): string => {
  if (!error) return DEFAULT_MESSAGE;
  if (typeof error === 'string') return error;

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    DEFAULT_MESSAGE
  );
};

const useErrorModal = () => {
  const [state, setState] = useState<ErrorModalConfig | null>(null);

  const hideError = useCallback(() => setState(null), []);

  const showError = useCallback(
    (error: ShowableError, overrides: ErrorModalConfig = {}) => {
    setState({
      variant: 'error',
      message: extractMessage(error),
      ...overrides,
      });
    },
    [],
  );

  const showMessage = useCallback((config: ErrorModalConfig = {}) => {
    setState({variant: 'error', ...config});
  }, []);

  const modalProps = useMemo(
    () => ({
      visible: Boolean(state),
      title: state?.title,
      message: state?.message,
      variant: state?.variant,
      confirmText: state?.confirmText,
      closeText: state?.closeText,
      dismissable: state?.dismissable,
      onConfirm: state?.onConfirm
        ? () => {
            hideError();
            state.onConfirm?.();
          }
        : undefined,
      onClose: () => {
        state?.onClose?.();
        hideError();
      },
    }),
    [state, hideError],
  );

  return {error: state, showError, showMessage, hideError, modalProps};
};

export default useErrorModal;
