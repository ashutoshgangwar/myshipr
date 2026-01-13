export const extractDriverData = (rawText = '') => {
  if (!rawText) return {};

  const text = rawText.replace(/\n+/g, ' ').trim();
  console.log('[OCR RAW TEXT]', text);

  // NAME (2+ words, uppercase dominant)
  const nameMatch = rawText.match(
    /\b([A-Z]{3,}\s[A-Z]{3,}(?:\s[A-Z]{3,})?)\b/
  );

  // DOB
  const dobMatch = rawText.match(
    /(Date of Birth|DOB)[:\s]*([0-9]{2}[-/][0-9]{2}[-/][0-9]{4})/i
  );

  // LICENSE NUMBER (flexible)
  const licenseMatch = rawText.match(
    /\b([A-Z]{2}\d{2}\s?\d{6,12})\b/
  );

  // STATE
  let state = '';
  if (/uttar\s?pradesh/i.test(rawText)) state = 'Uttar Pradesh';

  // EXPIRY DATE (last future date)
  const dateMatches = rawText.match(/\b\d{2}-\d{2}-\d{4}\b/g);
  const expiry = dateMatches?.length ? dateMatches[dateMatches.length - 1] : '';

  const parsed = {
    name: nameMatch?.[1] || '',
    dob: dobMatch?.[2] || '',
    license: licenseMatch?.[1] || '',
    state,
    expiry,
  };

  console.log('[OCR PARSED DATA]', parsed);
  return parsed;
};
