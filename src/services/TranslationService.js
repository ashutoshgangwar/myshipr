const API_KEY = 'YOUR_GOOGLE_API_KEY';

export const translateToEnglish = async (text) => {
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
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
