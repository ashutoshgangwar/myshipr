import { useEffect, useRef, useState } from 'react';
import VoiceService from '../services/VoiceService';
import { requestMicPermission } from '../services/PermissionService';

const AUTO_STOP_DELAY = 700;

const useVoiceInput = () => {
  const [listening, setListening] = useState(false);
  const lastTextRef = useRef('');
  const onTextRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    VoiceService.onResult((text) => {
      if (!text) return;

      console.log('[useVoiceInput] got text:', text);
      lastTextRef.current = text;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        if (onTextRef.current) {
          console.log('[useVoiceInput] sending text to TextInput:', lastTextRef.current);
          onTextRef.current(lastTextRef.current);
        }
        setListening(false);
        VoiceService.stop();
        lastTextRef.current = '';
      }, AUTO_STOP_DELAY);
    });

    VoiceService.onError((e) => {
      console.log('[useVoiceInput] error:', e);
      setListening(false);
    });

    VoiceService.onEnd(() => {
      console.log('[useVoiceInput] speech ended');
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      VoiceService.destroy();
    };
  }, []);

  const start = async (callback, language = 'hi-IN') => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      console.log('Mic permission denied');
      return;
    }

    onTextRef.current = callback;
    lastTextRef.current = '';
    setListening(true);

    console.log('[useVoiceInput] START listening');
    VoiceService.start(language);
  };

  return { start, listening };
};

export default useVoiceInput;
