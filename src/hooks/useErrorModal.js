import {useCallback, useMemo, useState} from 'react';

const DEFAULT_MESSAGE = 'Unable to complete your request. Please try again.';

const extractMessage = error => {
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
  const [state, setState] = useState(null);

  const hideError = useCallback(() => setState(null), []);

  const showError = useCallback((error, overrides = {}) => {
    setState({
      variant: 'error',
      message: extractMessage(error),
      ...overrides,
    });
  }, []);

  const showMessage = useCallback((config = {}) => {
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
            state.onConfirm();
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
