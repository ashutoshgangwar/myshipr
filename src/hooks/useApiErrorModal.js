import {useCallback, useMemo, useState} from 'react';

const normalizeError = error => {
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
  const [apiError, setApiError] = useState(null);

  const showApiError = useCallback(error => {
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
