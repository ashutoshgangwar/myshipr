import {GOOGLE_MAPS_API_KEY} from '@env';

export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_MAPS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: 'en',
        }),
      }
    );

    const data = await res.json();
    return data.data.translations[0].translatedText;
  } catch (e) {
    console.log('Translation error', e);
    return text;
  }
};
