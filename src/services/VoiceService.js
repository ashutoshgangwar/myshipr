import Voice from '@react-native-voice/voice';

class VoiceService {
  start(language = 'hi-IN') {
    console.log('[VoiceService] START:', language);
    return Voice.start(language);
  }

  stop() {
    console.log('[VoiceService] STOP');
    return Voice.stop();
  }

  destroy() {
    console.log('[VoiceService] DESTROY');
    return Voice.destroy().then(Voice.removeAllListeners);
  }

  onResult(callback) {
    // Partial results (live speech)
    Voice.onSpeechPartialResults = (e) => {
      const text = e.value?.[0] || '';
      console.log('[VoiceService] PARTIAL:', text);
      callback(text);
    };

    // Final results
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0] || '';
      console.log('[VoiceService] FINAL:', text);
      callback(text);
    };
  }

  onError(callback) {
    Voice.onSpeechError = (e) => {
      console.log('[VoiceService] ERROR:', e);
      callback(e);
    };
  }

  onEnd(callback) {
    Voice.onSpeechEnd = () => {
      console.log('[VoiceService] SPEECH END');
      callback();
    };
  }
}

export default new VoiceService();
