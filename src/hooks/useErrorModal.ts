import {useCallback, useMemo, useState} from 'react';

import type {ApiErrorBody} from '../types/api';
import type {ErrorLike} from '../types/common';

/**
 * The app's one modal for telling the driver something — an API failure, an
 * API success, a validation slip, a "are you sure?".
 *
 *     const {modalProps, showError, showSuccess} = useErrorModal();
 *     ...
 *     <ErrorModal {...modalProps} />
 *
 * Every screen uses this rather than `Alert.alert`, so the driver sees one
 * dialog with one set of manners throughout. The native alert is styled by the
 * OS, cannot carry the app's variant colours, and looks like a system warning
 * rather than part of the app — which is exactly wrong for the message "your
 * password is set".
 *
 * The exception is code that runs OUTSIDE a component — `services/*` reaching
 * for a permission or GPS — which has no hook to call and stays on
 * `Alert.alert`.
 */

/** What the modal can be told to show. */
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
 * Anything `showError` accepts: a ready-made string, an axios failure, or an
 * error object. `extractMessage` walks all three.
 *
 * `ErrorLike` rather than `Error`, because that is what a `catch` binding is
 * cast to throughout this app — some native modules reject with a plain object
 * that never went through the `Error` constructor, and a stricter type here
 * would send every one of those call sites back to `Alert.alert`.
 */
export type ShowableError =
  | string
  | (ErrorLike & {response?: {data?: ApiErrorBody}})
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

  /**
   * A failure. Pass the error itself — axios failure, Error, or string — and
   * the message is dug out of whichever shape it is.
   */
  const showError = useCallback(
    (error: ShowableError, overrides: ErrorModalConfig = {}) => {
      setState({
        variant: 'error',
        title: 'Oops',
        message: extractMessage(error),
        ...overrides,
      });
    },
    [],
  );

  /** Anything at all, spelled out in full. Neutral unless given a variant. */
  const showMessage = useCallback((config: ErrorModalConfig = {}) => {
    setState({variant: 'info', ...config});
  }, []);

  /**
   * It worked. `closeText` defaults to OK rather than Close: the driver is
   * acknowledging good news, not dismissing a problem.
   */
  const showSuccess = useCallback(
    (message: string, overrides: ErrorModalConfig = {}) => {
      setState({
        variant: 'success',
        title: 'Done',
        message,
        closeText: 'OK',
        ...overrides,
      });
    },
    [],
  );

  /**
   * Something the driver has to fix before the action can run — an empty
   * field, a code that is too short, a step not finished yet. Their own slip
   * rather than a failure, so it is a warning and not an error.
   */
  const showWarning = useCallback(
    (title: string, message: string, overrides: ErrorModalConfig = {}) => {
      setState({
        variant: 'warning',
        title,
        message,
        closeText: 'OK',
        ...overrides,
      });
    },
    [],
  );

  /**
   * A question with a way out: Close backs off, the confirm button goes ahead.
   *
   * `onConfirm` is what a native alert's second button was, and the modal
   * closes itself before running it — so a handler that navigates cannot leave
   * the dialog stranded over the next screen.
   */
  const confirm = useCallback(
    ({
      title,
      message,
      confirmText = 'Confirm',
      closeText = 'Cancel',
      onConfirm,
      variant = 'warning',
      ...rest
    }: ErrorModalConfig & {onConfirm: () => void}) => {
      setState({title, message, confirmText, closeText, onConfirm, variant, ...rest});
    },
    [],
  );

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

  return {
    error: state,
    showError,
    showMessage,
    showSuccess,
    showWarning,
    confirm,
    hideError,
    modalProps,
  };
};

export default useErrorModal;
